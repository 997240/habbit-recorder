export type HabitType = 'numeric' | 'duration' | 'time-based' | 'check-in';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  unit?: string;
  target?: number | string;
  isActive: boolean;
  createdAt: string;
}

export interface HabitRecord {
  id: string;
  habitId: string;
  date: string;
  value: number | string | boolean;
  note?: string;
  createdAt: string;
}

export interface AppState {
  habits: Habit[];
  records: HabitRecord[];
  currentPage: 'dashboard' | 'habits' | 'record' | 'settings';
  selectedDate: string;
  timeRange: 'last7days' | 'week' | 'last30days' | 'month' | 'year' | 'custom';
  customRange: { start: string; end: string };
}