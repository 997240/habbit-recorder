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

  // 获取累计值的辅助函数
  getAccumulatedValue: (habitId: string, date: string): number => {
    const records = storage.getRecords();
    const record = records.find(r => r.habitId === habitId && r.date === date);
    if (!record || !record.values) return 0;
    
    return record.values.reduce((sum, entry) => {
      const value = typeof entry.value === 'number' ? entry.value : 0;
      return sum + value;
    }, 0);
  },

  // 获取记录的值（适用于所有习惯类型）
  getRecordValue: (habitId: string, date: string, habitType: 'numeric' | 'duration' | 'time-based' | 'check-in' | 'time-span'): number | string | boolean | object => {
    const records = storage.getRecords();
    const record = records.find(r => r.habitId === habitId && r.date === date);
    
    // 如果没有记录，返回默认值
    if (!record) return habitType === 'check-in' ? false : 0;
    
    // 处理新格式数据
    if (record.values && Array.isArray(record.values)) {
      // 数值型和时长型返回累计值
      if (habitType === 'numeric' || habitType === 'duration') {
        return record.values.reduce((sum, entry) => {
          const value = typeof entry.value === 'number' ? entry.value : 0;
          return sum + value;
        }, 0);
      }
      // 其他类型返回第一个值
      return record.values[0]?.value || (habitType === 'check-in' ? false : '');
    }
    
    // 兼容旧格式
    return (record as any).value || (habitType === 'check-in' ? false : 0);
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