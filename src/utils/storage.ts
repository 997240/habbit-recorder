import { Habit, HabitRecord, Todo } from '../types';

const STORAGE_KEYS = {
  APP_DATA: 'habit_tracker_app_data'  // 统一存储键
};

export const storage = {

  // Habits operations
  setHabits: (habits: Habit[]): void => {
    const appData = loadData();
    appData.habits = habits;
    saveData(appData);
  },

  getHabits: (): Habit[] => {
    const appData = loadData();
    return appData.habits;
  },

  addHabit: (habit: Habit): void => {
    const appData = loadData();
    appData.habits.push(habit);
    saveData(appData);
  },

  updateHabit: (updatedHabit: Habit): void => {
    const appData = loadData();
    const index = appData.habits.findIndex(habit => habit.id === updatedHabit.id);
    if (index !== -1) {
      appData.habits[index] = updatedHabit;
      saveData(appData);
    }
  },

  deleteHabit: (habitId: string): void => {
    const appData = loadData();
    appData.habits = appData.habits.filter(habit => habit.id !== habitId);
    saveData(appData);
  },

  // Records operations
  setRecords: (records: HabitRecord[]): void => {
    const appData = loadData();
    appData.records = records;
    saveData(appData);
  },

  getRecords: (): HabitRecord[] => {
    const appData = loadData();
    return appData.records;
  },

  addRecord: (record: HabitRecord): void => {
    const appData = loadData();
    
    // Check if record already exists for this habit on this date
    const existingIndex = appData.records.findIndex(
      r => r.habitId === record.habitId && r.date === record.date
    );
    
    if (existingIndex !== -1) {
      appData.records[existingIndex] = record;
    } else {
      appData.records.push(record);
    }
    
    saveData(appData);
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
    const appData = loadData();
    return appData.habits;
  },

  // Get all records (for export/import)
  getAllRecords: (): HabitRecord[] => {
    const appData = loadData();
    return appData.records;
  },
  
  // Get all todos (for export/import)
  getAllTodos: (): Todo[] => {
    const appData = loadData();
    return appData.todos || [];
  },

  // Clear all data
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEYS.APP_DATA);
  }
};

// 统一数据接口
interface AppData {
  habits: Habit[];
  records: HabitRecord[];
  todos: Todo[];
}

// 加载所有数据
export const loadData = (): AppData => {
  const appDataStr = localStorage.getItem(STORAGE_KEYS.APP_DATA);
  
  if (appDataStr) {
    try {
      const data = JSON.parse(appDataStr);
      return {
        habits: data.habits || [],
        records: data.records || [],
        todos: data.todos || []
      };
    } catch (e) {
      console.error('解析数据失败', e);
    }
  }
  
  // 返回空数据结构
  return { habits: [], records: [], todos: [] };
};

// 保存所有数据
export const saveData = (data: AppData): void => {
  // 确保数据完整性
  const completeData: AppData = {
    habits: data.habits || [],
    records: data.records || [],
    todos: data.todos || []
  };
  
  // 保存到统一存储
  localStorage.setItem(STORAGE_KEYS.APP_DATA, JSON.stringify(completeData));
};