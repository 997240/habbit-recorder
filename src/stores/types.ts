import { Habit, HabitRecord } from '../types';

// Store 相关的类型定义
export interface HabitStore {
  // 基础状态
  habits: Habit[];
  records: HabitRecord[];
  
  // Habit 相关操作
  addHabit: (habit: Habit) => void;
  updateHabit: (habit: Habit) => void;
  deleteHabit: (habitId: string) => void;
  toggleHabitActive: (habitId: string) => void;
  moveHabitUp: (habitId: string) => void;
  moveHabitDown: (habitId: string) => void;
  
  // Record 相关操作
  addRecord: (record: HabitRecord) => void;
  addMultipleRecords: (records: HabitRecord[]) => void;
  
  // 初始化数据（从 localStorage 加载）
  loadInitialData: () => void;
}
