import { User, Habit, HabitRecord } from '../types';

const STORAGE_KEYS = {
  USER: 'habit_tracker_user',
  HABITS: 'habit_tracker_habits',
  RECORDS: 'habit_tracker_records'
};

export const storage = {
  // User operations
  setUser: (user: User): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser: (): User | null => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  },

  clearUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Habits operations
  setHabits: (habits: Habit[]): void => {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  },

  getHabits: (userId: string): Habit[] => {
    const habitsData = localStorage.getItem(STORAGE_KEYS.HABITS);
    const allHabits: Habit[] = habitsData ? JSON.parse(habitsData) : [];
    return allHabits.filter(habit => habit.userId === userId);
  },

  addHabit: (habit: Habit): void => {
    const habitsData = localStorage.getItem(STORAGE_KEYS.HABITS);
    const allHabits: Habit[] = habitsData ? JSON.parse(habitsData) : [];
    allHabits.push(habit);
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(allHabits));
  },

  updateHabit: (updatedHabit: Habit): void => {
    const habitsData = localStorage.getItem(STORAGE_KEYS.HABITS);
    const allHabits: Habit[] = habitsData ? JSON.parse(habitsData) : [];
    const index = allHabits.findIndex(habit => habit.id === updatedHabit.id);
    if (index !== -1) {
      allHabits[index] = updatedHabit;
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(allHabits));
    }
  },

  deleteHabit: (habitId: string): void => {
    const habitsData = localStorage.getItem(STORAGE_KEYS.HABITS);
    const allHabits: Habit[] = habitsData ? JSON.parse(habitsData) : [];
    const filteredHabits = allHabits.filter(habit => habit.id !== habitId);
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(filteredHabits));
  },

  // Records operations
  setRecords: (records: HabitRecord[]): void => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  },

  getRecords: (userId: string): HabitRecord[] => {
    const recordsData = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const allRecords: HabitRecord[] = recordsData ? JSON.parse(recordsData) : [];
    return allRecords.filter(record => record.userId === userId);
  },

  addRecord: (record: HabitRecord): void => {
    const recordsData = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const allRecords: HabitRecord[] = recordsData ? JSON.parse(recordsData) : [];
    
    // Check if record already exists for this habit on this date
    const existingIndex = allRecords.findIndex(
      r => r.habitId === record.habitId && r.date === record.date && r.userId === record.userId
    );
    
    if (existingIndex !== -1) {
      allRecords[existingIndex] = record;
    } else {
      allRecords.push(record);
    }
    
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(allRecords));
  }
};