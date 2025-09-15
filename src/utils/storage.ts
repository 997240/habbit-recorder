import { Habit, HabitRecord, Todo } from '../types';

const STORAGE_KEYS = {
  HABITS: 'habit_tracker_habits',
  RECORDS: 'habit_tracker_records',
  APP_DATA: 'habit_tracker_app_data'  // 新的统一存储键
};

export const storage = {

  // Habits operations
  setHabits: (habits: Habit[]): void => {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  },

  getHabits: (): Habit[] => {
    // 优先从新格式读取，确保数据一致性
    const appData = loadData();
    if (appData.habits && appData.habits.length > 0) {
      return appData.habits;
    }
    
    // 降级到旧格式
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
    // 双写策略：同时更新旧格式和新格式
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    
    // 同时更新新格式存储
    const appData = loadData();
    appData.records = records;
    saveData(appData);
  },

  getRecords: (): HabitRecord[] => {
    // 优先从新格式读取，确保数据一致性
    const appData = loadData();
    if (appData.records && appData.records.length > 0) {
      return appData.records;
    }
    
    // 降级到旧格式
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
    
    // 双写策略：同时更新旧格式和新格式
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(allRecords));
    
    // 同时更新新格式存储
    const appData = loadData();
    appData.records = allRecords;
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
    const habitsData = localStorage.getItem(STORAGE_KEYS.HABITS);
    return habitsData ? JSON.parse(habitsData) : [];
  },

  // Get all records (for export/import)
  getAllRecords: (): HabitRecord[] => {
    const recordsData = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return recordsData ? JSON.parse(recordsData) : [];
  },
  
  // Get all todos (for export/import)
  getAllTodos: (): Todo[] => {
    const appData = loadData();
    return appData.todos || [];
  },

  // Clear all data
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEYS.HABITS);
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.APP_DATA);
  }
};

// 新的统一数据接口，支持向后兼容
interface AppData {
  habits: Habit[];
  records: HabitRecord[];
  todos?: Todo[];  // 可选，确保向后兼容
}

// 加载所有数据（智能选择数据源）
export const loadData = (): AppData => {
  // 首先尝试加载新格式的统一数据
  const appDataStr = localStorage.getItem(STORAGE_KEYS.APP_DATA);
  const oldRecordsStr = localStorage.getItem(STORAGE_KEYS.RECORDS);
  const oldHabitsStr = localStorage.getItem(STORAGE_KEYS.HABITS);
  
  let appData: AppData | null = null;
  let oldData: AppData | null = null;
  
  // 解析新格式数据
  if (appDataStr) {
    try {
      appData = JSON.parse(appDataStr);
      if (!appData!.todos) {
        appData!.todos = [];
      }
    } catch (e) {
      console.error('解析新格式数据失败', e);
    }
  }
  
  // 解析旧格式数据
  if (oldHabitsStr || oldRecordsStr) {
    oldData = {
      habits: oldHabitsStr ? JSON.parse(oldHabitsStr) : [],
      records: oldRecordsStr ? JSON.parse(oldRecordsStr) : [],
      todos: []
    };
  }
  
  // 智能选择数据源：比较数据新旧程度
  if (appData && oldData) {
    // 如果两种格式都存在，选择记录数更多的（可能是更新的）
    if (oldData.records.length > appData.records.length) {
      console.log('使用旧格式数据（记录更多）');
      saveData(oldData); // 同步到新格式
      return oldData;
    }
  }
  
  // 优先返回新格式数据
  if (appData) {
    return appData;
  }
  
  // 返回旧格式数据或空数据
  return oldData || { habits: [], records: [], todos: [] };
};

// 保存所有数据
export const saveData = (data: AppData): void => {
  // 确保todos字段存在
  if (!data.todos) {
    data.todos = [];
  }
  
  // 保存到新的统一存储
  localStorage.setItem(STORAGE_KEYS.APP_DATA, JSON.stringify(data));
  
  // 同时更新旧格式存储，确保向后兼容
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(data.habits));
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(data.records));
};