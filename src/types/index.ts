export type HabitType = 'numeric' | 'duration' | 'time-based' | 'check-in' | 'time-span';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  unit?: string;
  target?: number | string;
  isActive: boolean;
  createdAt: string;
  monthlyStartDay?: number;
  order: number;
}

export interface HabitRecord {
  id: string;
  habitId: string;
  date: string;
  // 将单一value改为values数组
  values: Array<{
    id: string;         // 每条记录的唯一ID
    value: number | string | boolean | object;
    timestamp: string;  // 记录时间戳
  }>;
  note?: string;
  createdAt: string;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  order: number;
  createdAt: string;
  completedAt: string | null;
}

export interface AppState {
  habits: Habit[];
  records: HabitRecord[];
  todos: Todo[];
  currentPage: 'dashboard' | 'habits' | 'record' | 'todos' | 'settings';
  selectedDate: string;
  timeRange: 'last7days' | 'week' | 'last30days' | 'month' | 'year' | 'custom';
  customRange: { start: string; end: string };
}