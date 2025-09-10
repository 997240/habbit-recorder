export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  googleId: string;
}

export type HabitType = 'numeric' | 'duration' | 'time-based' | 'check-in';

export interface Habit {
  id: string;
  userId: string;
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
  userId: string;
  date: string;
  value: number | string | boolean;
  note?: string;
  createdAt: string;
}

export interface AppState {
  user: User | null;
  habits: Habit[];
  records: HabitRecord[];
  currentPage: 'dashboard' | 'habits' | 'record';
  selectedDate: string;
  timeRange: 'week' | 'month' | 'year' | 'custom';
  customRange: { start: string; end: string };
}