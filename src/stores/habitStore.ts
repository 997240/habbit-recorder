import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { HabitStore } from './types';
import { Habit, HabitRecord } from '../types';
import { storage } from '../utils/storage';

export const useHabitStore = create<HabitStore>()(
  devtools(
    (set, get) => ({
  // 基础状态
  habits: [],
  records: [],
  
  // Habit 相关操作
  addHabit: (habit: Habit) => {
    // 保存到 localStorage
    storage.addHabit(habit);
    // 更新状态
    set((state) => ({
      habits: [...state.habits, habit]
    }));
  },
  
  updateHabit: (habit: Habit) => {
    // 保存到 localStorage
    storage.updateHabit(habit);
    // 更新状态
    set((state) => ({
      habits: state.habits.map(h => h.id === habit.id ? habit : h)
    }));
  },
  
  deleteHabit: (habitId: string) => {
    // 从 localStorage 删除
    storage.deleteHabit(habitId);
    // 更新状态
    set((state) => ({
      habits: state.habits.filter(h => h.id !== habitId)
    }));
  },
  
  toggleHabitActive: (habitId: string) => {
    const habit = get().habits.find(h => h.id === habitId);
    if (habit) {
      const updatedHabit = { ...habit, isActive: !habit.isActive };
      // 保存到 localStorage
      storage.updateHabit(updatedHabit);
      // 更新状态
      set((state) => ({
        habits: state.habits.map(h => h.id === habitId ? updatedHabit : h)
      }));
    }
  },
  
  // Record 相关操作
  addRecord: (newRecord: HabitRecord) => {
    // 保存到 localStorage
    storage.addRecord(newRecord);
    
    // 更新状态 - 处理已存在的记录
    set((state) => {
      const existingIndex = state.records.findIndex(
        r => r.habitId === newRecord.habitId && r.date === newRecord.date
      );
      
      if (existingIndex !== -1) {
        // 更新已存在的记录
        const updatedRecords = [...state.records];
        updatedRecords[existingIndex] = newRecord;
        return { records: updatedRecords };
      } else {
        // 添加新记录
        return { records: [...state.records, newRecord] };
      }
    });
  },
  
  addMultipleRecords: (newRecords: HabitRecord[]) => {
    // 批量保存到 localStorage
    newRecords.forEach(record => storage.addRecord(record));
    
    // 批量更新状态
    set((state) => {
      const updatedRecordIds: string[] = [];
      const recordsToAdd: HabitRecord[] = [];
      
      // 分类处理：更新的和新增的
      newRecords.forEach(newRecord => {
        const existingRecord = state.records.find(
          r => r.habitId === newRecord.habitId && r.date === newRecord.date
        );
        
        if (existingRecord) {
          updatedRecordIds.push(existingRecord.id);
        }
        recordsToAdd.push(newRecord);
      });
      
      // 过滤掉需要更新的记录，然后添加所有新记录
      const filteredRecords = state.records.filter(r => !updatedRecordIds.includes(r.id));
      return { records: [...filteredRecords, ...recordsToAdd] };
    });
  },
  
  // 初始化数据
  loadInitialData: () => {
    const habits = storage.getHabits();
    const records = storage.getRecords();
    set({ habits, records });
  }
}),
    {
      name: 'habit-store', // DevTools 中显示的名称
    }
  )
);
