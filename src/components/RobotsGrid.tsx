import { useMemo, useRef, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridOptions, ColumnMovedEvent, GridApi, GridReadyEvent } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useRobotsStore, transposeRobotsData } from '../stores/robotsStore';

// Регистрация модулей AG Grid
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Компонент для отображения таблицы роботов с использованием ag-grid
 */
export const RobotsGrid: React.FC = () => {
  const { robots, isLoading, error, initializeRobots } = useRobotsStore();
  const gridApiRef = useRef<GridApi | null>(null);

  // Инициализируем данные при монтировании компонента
  useEffect(() => {
    if (robots.length === 0 && !isLoading) {
      initializeRobots();
    }
  }, [robots.length, isLoading, initializeRobots]);

  // Получаем транспонированные данные (вычисляемое значение)
  const transposedData = useMemo(() => {
    if (robots.length === 0) {
      return { rows: [], robots: [] };
    }
    return transposeRobotsData(robots);
  }, [robots]);
  const { rows, robots: robotList } = transposedData;

  // Обработчик готовности грида
  const handleGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  }, []);


  // Обработчик после перемещения - проверяем и исправляем если нужно
  const handleColumnMoved = useCallback((event: ColumnMovedEvent) => {
    if (!event.column || !gridApiRef.current) return;

    const movedColumnId = event.column.getColId();
    
    // Если перемещается сам столбец "parameter", разрешаем
    if (movedColumnId === 'parameter') {
      return;
    }

    // Даем время AG Grid обновить порядок
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!gridApiRef.current) return;

        try {
          // Получаем все столбцы в порядке отображения
          const api = gridApiRef.current as unknown as {
            columnApi?: { getAllDisplayedColumns: () => Array<{ getColId: () => string }> };
          };
          
          let allColumns: Array<{ getColId: () => string }> = [];
          
          if (api.columnApi) {
            allColumns = api.columnApi.getAllDisplayedColumns();
          } else {
            const cols = gridApiRef.current.getColumns() || [];
            const colsWithPos = cols.map((col) => {
              const left = (col as unknown as { getLeft?: () => number | null }).getLeft?.() ?? null;
              return {
                col,
                left: left ?? 0,
              };
            });
            colsWithPos.sort((a, b) => a.left - b.left);
            allColumns = colsWithPos.map((item) => item.col);
          }
          
          // Находим позицию столбца "parameter"
          const parameterIndex = allColumns.findIndex((col) => col.getColId() === 'parameter');
          const movedColumnIndex = allColumns.findIndex((col) => col.getColId() === movedColumnId);
          
          // Если перемещенный столбец оказался перед "parameter", возвращаем его обратно
          if (parameterIndex !== -1 && movedColumnIndex !== -1 && movedColumnIndex < parameterIndex) {
            // Перемещаем столбец обратно после parameter
            try {
              const api = gridApiRef.current;
              
              // Используем moveColumns для перемещения столбца на позицию после parameter
              // В AG Grid v35 используется moveColumns
              const targetIndex = parameterIndex + 1;
              
              // Используем moveColumns
              const moveColumns = (api as unknown as { moveColumns?: (columns: unknown[], toIndex: number) => void }).moveColumns;
              if (moveColumns) {
                const columnToMove = allColumns[movedColumnIndex];
                moveColumns([columnToMove], targetIndex);
              }
              
              // Дополнительно обновляем отображение
              setTimeout(() => {
                if (gridApiRef.current) {
                  gridApiRef.current.refreshCells({ force: true });
                }
              }, 50);
            } catch (moveError) {
              console.error('Ошибка при возврате столбца:', moveError);
            }
          }
        } catch (error) {
          console.error('Ошибка при проверке перемещения столбца:', error);
        }
      });
    });
  }, []);

  // Создаем определения столбцов динамически
  const columnDefs: ColDef[] = useMemo(() => {
    const cols: ColDef[] = [
      {
        field: 'parameter',
        headerName: 'Параметр',
        width: 200,
        pinned: 'left',
        sortable: false,
        filter: false,
        lockPosition: 'left', // Блокируем перемещение столбца "parameter" слева
        suppressMovable: false, // Разрешаем перемещение, но блокируем позицию
        cellStyle: { fontWeight: 'bold' },
      },
    ];

    // Добавляем столбец для каждого робота
    robotList.forEach((robot, index) => {
      const isBaseRobot = index === 0;
      
      cols.push({
        field: `robot_${index}`,
        headerName: robot.name,
        width: 150,
        sortable: false,
        filter: false,
        suppressMovable: false, // Разрешаем перемещение
        valueFormatter: (params) => {
          if (params.value == null || params.value === '-') return '-';
          if (typeof params.value === 'number') {
            // Форматируем большие числа
            if (params.value >= 1000) {
              return params.value.toLocaleString('ru-RU');
            }
            return params.value.toString();
          }
          return params.value;
        },
        cellStyle: (params) => {
          const baseStyle: Record<string, string> = {
            textAlign: 'right', // Все значения выравниваем по правому краю
          };

          // Базовый робот не сравниваем
          if (isBaseRobot) {
            return baseStyle;
          }

          // Получаем значения
          const baseValue = params.data?.robot_0;
          const currentValue = params.value;
          const parameterName = params.data?.parameter as string;

          // Тип и Уровень - без цветового различия
          if (parameterName === 'Тип' || parameterName === 'Уровень') {
            return baseStyle;
          }

          // Функция для преобразования значения в число (прочерк = 0)
          const getNumericValue = (value: unknown): number => {
            if (value === '-' || value == null) return 0;
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
              // Убираем символы типа "с", "%" и т.д.
              const num = parseFloat(value.replace(/[^\d.-]/g, ''));
              return isNaN(num) ? 0 : num;
            }
            return 0;
          };

          // Функция для проверки наличия значения (не прочерк)
          const hasValue = (value: unknown): boolean => {
            return value !== '-' && value != null;
          };

          // Обработка дополнительных параметров (неуязвимость, ускорение, прокачка)
          if (
            parameterName === 'Доп. неуязвимость' ||
            parameterName === 'Доп. ускорение'
          ) {
            const baseHasValue = hasValue(baseValue);
            const currentHasValue = hasValue(currentValue);

            if (currentHasValue && !baseHasValue) {
              baseStyle.color = '#2e7d32'; // зеленый
            } else if (!currentHasValue && baseHasValue) {
              baseStyle.color = '#d32f2f'; // красный
            }
            return baseStyle;
          }

          // Обработка прокачки
          if (parameterName === 'Прокачка (реглы %)') {
            const baseHasValue = hasValue(baseValue);
            const currentHasValue = hasValue(currentValue);

            if (currentHasValue && !baseHasValue) {
              baseStyle.color = '#d32f2f'; // красный
            } else if (!currentHasValue && baseHasValue) {
              baseStyle.color = '#2e7d32'; // зеленый
            }
            return baseStyle;
          }

          // Обработка цен покупки
          if (
            parameterName === 'Цена покупки (бонусы)' ||
            parameterName === 'Цена покупки (реглы)'
          ) {
            const baseNum = getNumericValue(baseValue);
            const currentNum = getNumericValue(currentValue);

            if (currentNum !== baseNum) {
              if (currentNum > baseNum) {
                baseStyle.color = '#d32f2f'; // красный
              } else {
                baseStyle.color = '#2e7d32'; // зеленый
              }
            }
            return baseStyle;
          }

          // Обработка цен продажи
          if (
            parameterName === 'Цена продажи (бонусы)' ||
            parameterName === 'Цена продажи (реглы)'
          ) {
            const baseNum = getNumericValue(baseValue);
            const currentNum = getNumericValue(currentValue);

            if (currentNum !== baseNum) {
              if (currentNum > baseNum) {
                baseStyle.color = '#2e7d32'; // зеленый
              } else {
                baseStyle.color = '#d32f2f'; // красный
              }
            }
            return baseStyle;
          }

          // Обработка остальных параметров (больше = зеленый, меньше = красный)
          const baseNum = getNumericValue(baseValue);
          const currentNum = getNumericValue(currentValue);

          if (currentNum !== baseNum) {
            if (currentNum > baseNum) {
              baseStyle.color = '#2e7d32'; // зеленый
            } else {
              baseStyle.color = '#d32f2f'; // красный
            }
          }

          return baseStyle;
        },
      });
    });

    return cols;
  }, [robotList]);

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      sortable: false,
      filter: false,
    }),
    []
  );

  const gridOptions: GridOptions = useMemo(
    () => ({
      theme: 'legacy', // Используем legacy темы (CSS файлы)
      pagination: false, // Отключаем пагинацию для транспонированной таблицы
      animateRows: true,
      suppressHorizontalScroll: false,
      onGridReady: handleGridReady,
      onColumnMoved: handleColumnMoved,
      localeText: {
        // Кастомизация текстов на русский
        page: 'Страница',
        more: 'Больше',
        to: 'до',
        of: 'из',
        next: 'Следующая',
        last: 'Последняя',
        first: 'Первая',
        previous: 'Предыдущая',
        loadingOoo: 'Загрузка...',
        noRowsToShow: 'Нет данных для отображения',
        filterOoo: 'Фильтр...',
        equals: 'Равно',
        notEqual: 'Не равно',
        lessThan: 'Меньше',
        greaterThan: 'Больше',
        lessThanOrEqual: 'Меньше или равно',
        greaterThanOrEqual: 'Больше или равно',
        inRange: 'В диапазоне',
        contains: 'Содержит',
        notContains: 'Не содержит',
        startsWith: 'Начинается с',
        endsWith: 'Заканчивается на',
        andCondition: 'И',
        orCondition: 'ИЛИ',
        applyFilter: 'Применить фильтр',
        resetFilter: 'Сбросить фильтр',
        clearFilter: 'Очистить фильтр',
      },
    }),
    [handleGridReady, handleColumnMoved]
  );

  // Показываем загрузку или ошибку
  if (isLoading) {
    return (
      <Box sx={{ width: '100%', height: '100vh', p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', height: '100vh', p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!transposedData || rows.length === 0) {
    return (
      <Box sx={{ width: '100%', height: '100vh', p: 2 }}>
        <Alert severity="info">Нет данных для отображения</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2 }}>
        Роботы Мехи.Земля
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Всего роботов: {robots.length}
      </Typography>
      <Box
        className="ag-theme-alpine"
        sx={{
          height: 'calc(100vh - 150px)',
          minHeight: '600px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AgGridReact
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
        />
      </Box>
    </Box>
  );
};
