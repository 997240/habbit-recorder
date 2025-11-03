import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { HabitStore } from './types';
import { Habit, HabitRecord } from '../types';
import { storage } from '../utils/storage';
import { calculateDuration, getCustomMonthRange, getTimeRangeDates } from '../utils/dateUtils';

export const useHabitStore = create<HabitStore>()(
  devtools(
    (set, get) => ({
  // 基础状态
  habits: [],
  records: [],
  
  // Habit 相关操作
  addHabit: (habit: Habit) => {
    // 为新习惯设置 order（设为当前最大值 + 1）
    const maxOrder = Math.max(0, ...get().habits.map(h => h.order || 0));
    const habitWithOrder = { ...habit, order: maxOrder + 1 };
    
    // 保存到 localStorage
    storage.addHabit(habitWithOrder);
    // 更新状态
    set((state) => ({
      habits: [...state.habits, habitWithOrder]
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
  
  moveHabitUp: (habitId: string) => {
    const habits = get().habits;
    const activeHabits = habits.filter(h => h.isActive).sort((a, b) => a.order - b.order);
    const currentIndex = activeHabits.findIndex(h => h.id === habitId);
    
    // 如果已经是第一个，不能上移
    if (currentIndex <= 0) return;
    
    // 交换 order
    const currentHabit = activeHabits[currentIndex];
    const previousHabit = activeHabits[currentIndex - 1];
    const tempOrder = currentHabit.order;
    
    const updatedCurrentHabit = { ...currentHabit, order: previousHabit.order };
    const updatedPreviousHabit = { ...previousHabit, order: tempOrder };
    
    // 保存到 localStorage
    storage.updateHabit(updatedCurrentHabit);
    storage.updateHabit(updatedPreviousHabit);
    
    // 更新状态
    set((state) => ({
      habits: state.habits.map(h => {
        if (h.id === updatedCurrentHabit.id) return updatedCurrentHabit;
        if (h.id === updatedPreviousHabit.id) return updatedPreviousHabit;
        return h;
      })
    }));
  },
  
  moveHabitDown: (habitId: string) => {
    const habits = get().habits;
    const activeHabits = habits.filter(h => h.isActive).sort((a, b) => a.order - b.order);
    const currentIndex = activeHabits.findIndex(h => h.id === habitId);
    
    // 如果已经是最后一个，不能下移
    if (currentIndex < 0 || currentIndex >= activeHabits.length - 1) return;
    
    // 交换 order
    const currentHabit = activeHabits[currentIndex];
    const nextHabit = activeHabits[currentIndex + 1];
    const tempOrder = currentHabit.order;
    
    const updatedCurrentHabit = { ...currentHabit, order: nextHabit.order };
    const updatedNextHabit = { ...nextHabit, order: tempOrder };
    
    // 保存到 localStorage
    storage.updateHabit(updatedCurrentHabit);
    storage.updateHabit(updatedNextHabit);
    
    // 更新状态
    set((state) => ({
      habits: state.habits.map(h => {
        if (h.id === updatedCurrentHabit.id) return updatedCurrentHabit;
        if (h.id === updatedNextHabit.id) return updatedNextHabit;
        return h;
      })
    }));
  },
  
  // Record 相关操作
  addRecord: (newRecord: HabitRecord) => {
    // 保存到 localStorage
    storage.addRecord(newRecord);
    
    // 更新状态 - 使用复合键处理已存在的记录
    set((state) => {
      // 创建复合键
      const newKey = `${newRecord.habitId}_${newRecord.date}`;
      
      // 过滤掉相同复合键的旧记录
      const filteredRecords = state.records.filter(r => {
        const key = `${r.habitId}_${r.date}`;
        return key !== newKey;
      });
      
      // 添加新记录
      return { records: [...filteredRecords, newRecord] };
    });
  },
  
  addMultipleRecords: (newRecords: HabitRecord[]) => {
    // 批量保存到 localStorage
    newRecords.forEach(record => storage.addRecord(record));
    
    // 批量更新状态 - 使用复合键匹配而不是ID匹配
    set((state) => {
      // 创建复合键集合，用于识别需要更新的记录
      const updatedKeys = new Set<string>();
      const recordsToAdd: HabitRecord[] = [];
      
      // 收集所有新记录的复合键
      newRecords.forEach(newRecord => {
        const key = `${newRecord.habitId}_${newRecord.date}`;
        updatedKeys.add(key);
        recordsToAdd.push(newRecord);
      });
      
      // 过滤掉需要更新的记录（基于复合键），然后添加所有新记录
      const filteredRecords = state.records.filter(r => {
        const key = `${r.habitId}_${r.date}`;
        return !updatedKeys.has(key);
      });
      
      return { records: [...filteredRecords, ...recordsToAdd] };
    });
  },
  
  // 初始化数据
  loadInitialData: () => {
    let habits = storage.getHabits();
    let records = storage.getRecords();
    
    // 数据迁移：为没有 order 字段的习惯添加 order
    let needsUpdate = false;
    habits = habits.map((habit, index) => {
      if (habit.order === undefined || habit.order === null) {
        needsUpdate = true;
        return { ...habit, order: index + 1 };
      }
      return habit;
    });
    
    // 如果有习惯缺少 order，更新存储
    if (needsUpdate) {
      habits.forEach(habit => storage.updateHabit(habit));
    }
    
    // 数据完整性验证：移除重复记录
    const recordMap = new Map<string, HabitRecord>();
    records.forEach(record => {
      const key = `${record.habitId}_${record.date}`;
      // 如果已存在相同的复合键，保留最新的记录
      if (!recordMap.has(key) || 
          (recordMap.get(key)!.createdAt < record.createdAt)) {
        recordMap.set(key, record);
      }
    });
    
    // 如果发现并清理了重复记录，更新存储
    if (recordMap.size < records.length) {
      console.log(`清理了 ${records.length - recordMap.size} 条重复记录`);
      records = Array.from(recordMap.values());
      // 更新存储中的记录
      storage.setRecords(records);
    }
    
    set({ habits, records });
  }
}),
    {
      name: 'habit-store', // DevTools 中显示的名称
    }
  )
);

// 辅助函数：获取时间段习惯的周度总时长
export const getWeeklyTotal = (habitId: string): number => {
  const { habits, records } = useHabitStore.getState();
  const habit = habits.find(h => h.id === habitId);
  
  if (!habit || habit.type !== 'time-span') return 0;
  
  const weekRange = getTimeRangeDates('week');
  const habitRecords = records.filter(r => 
    r.habitId === habitId && 
    r.date >= weekRange.start && 
    r.date <= weekRange.end
  );
  
  let totalHours = 0;
  habitRecords.forEach(record => {
    if (record.values && record.values.length > 0) {
      const value = record.values[0].value;
      if (typeof value === 'object' && value !== null) {
        const timeSpanData = value as any;
        const duration = calculateDuration(
          timeSpanData.startTime,
          timeSpanData.endTime,
          timeSpanData.deduction || 0
        );
        totalHours += duration;
      }
    }
  });
  
  return Math.round(totalHours * 100) / 100;
};

// 辅助函数：获取时间段习惯的月度总时长
export const getMonthlyTotal = (habitId: string): number => {
  const { habits, records } = useHabitStore.getState();
  const habit = habits.find(h => h.id === habitId);
  
  if (!habit || habit.type !== 'time-span') return 0;
  
  const monthRange = habit.monthlyStartDay 
    ? getCustomMonthRange(habit.monthlyStartDay)
    : getTimeRangeDates('month');
    
  const habitRecords = records.filter(r => 
    r.habitId === habitId && 
    r.date >= monthRange.start && 
    r.date <= monthRange.end
  );
  
  let totalHours = 0;
  habitRecords.forEach(record => {
    if (record.values && record.values.length > 0) {
      const value = record.values[0].value;
      if (typeof value === 'object' && value !== null) {
        const timeSpanData = value as any;
        const duration = calculateDuration(
          timeSpanData.startTime,
          timeSpanData.endTime,
          timeSpanData.deduction || 0
        );
        totalHours += duration;
      }
    }
  });
  
  return Math.round(totalHours * 100) / 100;
};

