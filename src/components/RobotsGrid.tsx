import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridOptions } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { Box, Typography } from '@mui/material';
import type { Robot } from '../types/robot';
import robotsData from '../../data/robots.json';

// Регистрация модулей AG Grid
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Преобразует данные роботов в транспонированный формат
 * (параметры в строках, роботы в столбцах)
 */
function transposeRobotsData(robots: Robot[]) {
  const rows: Record<string, unknown>[] = [];

  // Базовые параметры
  rows.push({
    parameter: 'Название',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.name;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Модель',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.model;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Тип',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.type;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Уровень',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.requiredLevel;
      return acc;
    }, {} as Record<string, unknown>),
  });

  // Характеристики
  rows.push({
    parameter: 'Прочность',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.durability;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Вместимость',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.capacity;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Макс. вместимость',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.maxCapacity ?? '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Скорость',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.speed;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Макс. скорость',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.maxSpeed;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Броня',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.armor;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Поля',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.energyFields;
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Восстановление/мин',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.stats.regenerationPerMinute ?? '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Доп. неуязвимость',
    ...robots.reduce((acc, robot, index) => {
      const value = robot.stats.additionalInvulnerability;
      acc[`robot_${index}`] = value != null ? `${value > 0 ? '+' : ''}${value}с` : '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Доп. ускорение',
    ...robots.reduce((acc, robot, index) => {
      const value = robot.stats.additionalAcceleration;
      acc[`robot_${index}`] = value != null ? `${value > 0 ? '+' : ''}${value}с` : '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  // Цены
  rows.push({
    parameter: 'Цена покупки (бонусы)',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.buyPrice?.bonds ?? '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Цена покупки (реглы)',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.buyPrice?.regls ?? '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Цена продажи (бонусы)',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.sellPrice?.bonds ?? '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Цена продажи (реглы)',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.sellPrice?.regls ?? '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  rows.push({
    parameter: 'Прокачка (реглы %)',
    ...robots.reduce((acc, robot, index) => {
      acc[`robot_${index}`] = robot.upgradeReglPercent ? `${robot.upgradeReglPercent}%` : '-';
      return acc;
    }, {} as Record<string, unknown>),
  });

  return { rows, robots };
}

/**
 * Компонент для отображения таблицы роботов с использованием ag-grid
 */
export const RobotsGrid: React.FC = () => {
  const robots = robotsData as Robot[];
  const { rows, robots: robotList } = transposeRobotsData(robots);

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
        cellStyle: { fontWeight: 'bold' },
      },
    ];

    // Добавляем столбец для каждого робота
    robotList.forEach((robot, index) => {
      cols.push({
        field: `robot_${index}`,
        headerName: robot.name,
        width: 150,
        sortable: false,
        filter: false,
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
          // Подсветка для числовых значений
          if (typeof params.value === 'number') {
            return { textAlign: 'right' };
          }
          return { textAlign: 'left' };
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
      pagination: false, // Отключаем пагинацию для транспонированной таблицы
      enableRangeSelection: true,
      rowSelection: 'multiple',
      suppressRowClickSelection: true,
      animateRows: true,
      suppressHorizontalScroll: false,
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
    []
  );

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
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
    </Box>
  );
};
