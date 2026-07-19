import type { ComponentType } from 'react';
import {
  Bot,
  CalendarClock,
  Calculator,
  MessagesSquare,
  PackageSearch,
  Scale,
  Settings,
  Target,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import { InventoryParserView } from '../features/inventory-parser/InventoryParserView';

// Дескриптор фичи-таба. Добавление хотелки = одна строка реестра (+ вью,
// когда фичу делаем). `enabled: false` — disabled-плейсхолдер: кнопка в
// рельсе видна и отдаёт тултип, но не выбирается; Component ещё нет.
export interface FeatureTab {
  id: string;
  icon: LucideIcon;
  label: string;
  tooltip: string;
  Component?: ComponentType;
  enabled: boolean;
}

// Порядок = порядок в рельсе. Приоритеты подцелей — program--cop.
export const FEATURES: FeatureTab[] = [
  {
    id: 'inventory-parser',
    icon: PackageSearch,
    label: 'Парсер инвентаря',
    tooltip: 'Снятие скрина окна и распознавание позиций инвентаря',
    Component: InventoryParserView,
    enabled: true,
  },
  {
    id: 'assistant',
    icon: Bot,
    label: 'Помощник',
    tooltip: 'Помощник по рутине игры и автоматизация действий',
    enabled: false,
  },
  {
    id: 'warehouse',
    icon: Warehouse,
    label: 'Клановый склад',
    tooltip: 'Общий склад клана: внесение предметов, остатки, заявки на выдачу',
    enabled: false,
  },
  {
    id: 'planner',
    icon: CalendarClock,
    label: 'Планировщик',
    tooltip: 'Личный планировщик задач и напоминаний',
    enabled: false,
  },
  {
    id: 'debts',
    icon: Scale,
    label: 'Долги',
    tooltip: 'Учёт долгов и взаимных обязательств',
    enabled: false,
  },
  {
    id: 'calculators',
    icon: Calculator,
    label: 'Калькуляторы',
    tooltip: 'Игровые калькуляторы: крафт, эффективность, стоимость',
    enabled: false,
  },
  {
    id: 'goals',
    icon: Target,
    label: 'Командные цели',
    tooltip: 'Цели клана с трекингом вклада каждого участника',
    enabled: false,
  },
  {
    id: 'voice-chat',
    icon: MessagesSquare,
    label: 'Войс / чат',
    tooltip: 'Общекомандная связь: голос и текстовый чат',
    enabled: false,
  },
  {
    id: 'settings',
    icon: Settings,
    label: 'Настройки',
    tooltip: 'Токен доступа, роль, настройки синхронизации',
    enabled: false,
  },
];
