import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Habit } from '../types';

interface UIStore {
  // 导航状态
  currentPage: 'dashboard' | 'habits' | 'record' | 'settings';
  
  // 表单状态
  showHabitForm: boolean;
  editingHabit: Habit | undefined;
  
  // 导航相关方法
  navigateTo: (page: 'dashboard' | 'habits' | 'record' | 'settings') => void;
  
  // 表单相关方法
  openHabitForm: (habit?: Habit) => void;
  closeHabitForm: () => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      // 初始状态
      currentPage: 'dashboard',
      showHabitForm: false,
      editingHabit: undefined,
      
      // 导航方法 - 只有离开习惯页面时才关闭表单
      navigateTo: (page) => set((state) => {
        const updates: Partial<UIStore> = { currentPage: page };
        
        // 只有当离开习惯页面时才关闭表单
        if (page !== 'habits') {
          updates.showHabitForm = false;
          updates.editingHabit = undefined;
        }
        
        return updates;
      }),
      
      // 表单方法 - 打开习惯表单
      openHabitForm: (habit) => set({ 
        showHabitForm: true,
        editingHabit: habit 
      }),
      
      // 表单方法 - 关闭习惯表单
      closeHabitForm: () => set({ 
        showHabitForm: false,
        editingHabit: undefined 
      })
    }),
    {
      name: 'ui-store', // DevTools 中显示的名称
    }
  )
);
