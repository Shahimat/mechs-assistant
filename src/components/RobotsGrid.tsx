import { useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridOptions } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { Box, Typography } from '@mui/material';
import type { Robot } from '../types/robot';
import robotsData from '../../data/robots.json';

// Регистрация модулей AG Grid
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Компонент для отображения таблицы роботов с использованием ag-grid
 */
export const RobotsGrid: React.FC = () => {
  const robots = robotsData as Robot[];

  const columnDefs: ColDef<Robot>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Название',
        width: 180,
        pinned: 'left',
        filter: 'agTextColumnFilter',
        sortable: true,
      },
      {
        field: 'model',
        headerName: 'Модель',
        width: 150,
        filter: 'agTextColumnFilter',
        sortable: true,
      },
      {
        field: 'type',
        headerName: 'Тип',
        width: 120,
        filter: 'agSetColumnFilter',
        sortable: true,
      },
      {
        field: 'requiredLevel',
        headerName: 'Уровень',
        width: 100,
        filter: 'agNumberColumnFilter',
        sortable: true,
        type: 'numericColumn',
      },
      {
        headerName: 'Характеристики',
        children: [
          {
            field: 'stats.durability',
            headerName: 'Прочность',
            width: 120,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
            valueFormatter: (params) => {
              if (params.value == null) return '';
              return params.value.toLocaleString('ru-RU');
            },
          },
          {
            field: 'stats.capacity',
            headerName: 'Вместимость',
            width: 120,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
            valueFormatter: (params) => {
              if (params.value == null) return '';
              return params.value.toLocaleString('ru-RU');
            },
          },
          {
            field: 'stats.maxCapacity',
            headerName: 'Макс. вместимость',
            width: 140,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
            valueFormatter: (params) => {
              if (params.value == null) return '';
              return params.value.toLocaleString('ru-RU');
            },
          },
          {
            field: 'stats.speed',
            headerName: 'Скорость',
            width: 100,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
          },
          {
            field: 'stats.maxSpeed',
            headerName: 'Макс. скорость',
            width: 130,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
          },
          {
            field: 'stats.armor',
            headerName: 'Броня',
            width: 100,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
          },
          {
            field: 'stats.energyFields',
            headerName: 'Поля',
            width: 100,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
          },
          {
            field: 'stats.regenerationPerMinute',
            headerName: 'Восстановление/мин',
            width: 160,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
            valueFormatter: (params) => {
              if (params.value == null) return '';
              return params.value.toLocaleString('ru-RU', {
                maximumFractionDigits: 2,
              });
            },
          },
          {
            field: 'stats.additionalInvulnerability',
            headerName: 'Доп. неуязвимость',
            width: 150,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
            valueFormatter: (params) => {
              if (params.value == null) return '';
              return `${params.value > 0 ? '+' : ''}${params.value}с`;
            },
          },
          {
            field: 'stats.additionalAcceleration',
            headerName: 'Доп. ускорение',
            width: 140,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
            valueFormatter: (params) => {
              if (params.value == null) return '';
              return `${params.value > 0 ? '+' : ''}${params.value}с`;
            },
          },
        ],
      },
      {
        headerName: 'Цены',
        children: [
          {
            field: 'buyPrice.bonds',
            headerName: 'Цена покупки (бонусы)',
            width: 160,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
            valueFormatter: (params) => {
              if (params.value == null) return '';
              return params.value.toLocaleString('ru-RU');
            },
          },
          {
            field: 'buyPrice.regls',
            headerName: 'Цена покупки (реглы)',
            width: 160,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
            valueFormatter: (params) => {
              if (params.value == null) return '-';
              return params.value.toLocaleString('ru-RU');
            },
          },
          {
            field: 'sellPrice.bonds',
            headerName: 'Цена продажи (бонусы)',
            width: 160,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
            valueFormatter: (params) => {
              if (params.value == null) return '';
              return params.value.toLocaleString('ru-RU');
            },
          },
          {
            field: 'sellPrice.regls',
            headerName: 'Цена продажи (реглы)',
            width: 160,
            filter: 'agNumberColumnFilter',
            sortable: true,
            type: 'numericColumn',
            valueFormatter: (params) => {
              if (params.value == null) return '-';
              return params.value.toLocaleString('ru-RU');
            },
          },
        ],
      },
      {
        field: 'upgradeReglPercent',
        headerName: 'Прокачка (реглы %)',
        width: 150,
        filter: 'agNumberColumnFilter',
        sortable: true,
        type: 'numericColumn',
        valueFormatter: (params) => {
          if (params.value == null) return '';
          return `${params.value}%`;
        },
      },
    ],
    []
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  const gridOptions: GridOptions<Robot> = useMemo(
    () => ({
      pagination: true,
      paginationPageSize: 50,
      paginationPageSizeSelector: [25, 50, 100, 200],
      enableRangeSelection: true,
      rowSelection: 'multiple',
      suppressRowClickSelection: true,
      animateRows: true,
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
        <AgGridReact<Robot>
          rowData={robots}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
    </Box>
  );
};
