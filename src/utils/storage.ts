import { Habit, HabitRecord } from '../types';

const STORAGE_KEYS = {
  HABITS: 'habit_tracker_habits',
  RECORDS: 'habit_tracker_records'
};

export const storage = {

  // Habits operations
  setHabits: (habits: Habit[]): void => {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  },

  getHabits: (): Habit[] => {
    const habitsData = localStorage.getItem(STORAGE_KEYS.HABITS);
    return habitsData ? JSON.parse(habitsData) : [];
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

  getRecords: (): HabitRecord[] => {
    const recordsData = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return recordsData ? JSON.parse(recordsData) : [];
  },

  addRecord: (record: HabitRecord): void => {
    const recordsData = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const allRecords: HabitRecord[] = recordsData ? JSON.parse(recordsData) : [];
    
    // Check if record already exists for this habit on this date
    const existingIndex = allRecords.findIndex(
      r => r.habitId === record.habitId && r.date === record.date
    );
    
    if (existingIndex !== -1) {
      allRecords[existingIndex] = record;
    } else {
      allRecords.push(record);
    }
    
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(allRecords));
  },

  // Get all habits (for export/import)
  getAllHabits: (): Habit[] => {
    const habitsData = localStorage.getItem(STORAGE_KEYS.HABITS);
    return habitsData ? JSON.parse(habitsData) : [];
  },

  // Get all records (for export/import)
  getAllRecords: (): HabitRecord[] => {
    const recordsData = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return recordsData ? JSON.parse(recordsData) : [];
  },

  // Clear all data
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEYS.HABITS);
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
  }
};