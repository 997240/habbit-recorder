import { create } from 'zustand';
import { Todo } from '../types';
import { loadData, saveData } from '../utils/storage';

interface TodoStore {
  todos: Todo[];
  showCompleted: boolean;
  
  // 初始化
  loadTodos: () => void;
  
  // 添加任务
  addTodo: (text: string, afterId?: string) => void;
  
  // 更新任务
  updateTodo: (id: string, text: string) => void;
  
  // 切换完成状态
  toggleTodo: (id: string) => void;
  
  // 删除任务
  deleteTodo: (id: string) => void;
  
  // 更新排序
  reorderTodos: (startIndex: number, endIndex: number) => void;
  
  // 切换显示已完成
  toggleShowCompleted: () => void;
  
  // 插入任务（用于回车分割）
  insertAfter: (afterId: string, beforeText: string, afterText: string) => string;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  showCompleted: false,
  
  loadTodos: () => {
    const data = loadData();
    if (data && data.todos) {
      set({ todos: data.todos });
    } else {
      // 向后兼容：如果没有todos字段，初始化为空数组
      set({ todos: [] });
    }
  },
  
  addTodo: (text: string, afterId?: string) => {
    // 过滤空白任务
    if (!text.trim()) return;
    
    const { todos } = get();
    const newTodo: Todo = {
      id: `todo_${Date.now()}`,
      text: text.trim(),
      completed: false,
      order: 0,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    
    let newTodos: Todo[];
    
    if (afterId) {
      // 在指定任务后面插入
      const index = todos.findIndex(t => t.id === afterId);
      if (index !== -1) {
        newTodos = [
          ...todos.slice(0, index + 1),
          newTodo,
          ...todos.slice(index + 1)
        ];
      } else {
        // 如果找不到指定任务，添加到未完成任务的末尾
        let lastIncompleteIndex = -1;
        for (let i = todos.length - 1; i >= 0; i--) {
          if (!todos[i].completed) {
            lastIncompleteIndex = i;
            break;
          }
        }
        
        if (lastIncompleteIndex !== -1) {
          newTodos = [
            ...todos.slice(0, lastIncompleteIndex + 1),
            newTodo,
            ...todos.slice(lastIncompleteIndex + 1)
          ];
        } else {
          newTodos = [newTodo, ...todos];
        }
      }
    } else {
      // 添加到未完成任务的末尾
      let lastIncompleteIndex = -1;
      for (let i = todos.length - 1; i >= 0; i--) {
        if (!todos[i].completed) {
          lastIncompleteIndex = i;
          break;
        }
      }
      
      if (lastIncompleteIndex !== -1) {
        newTodos = [
          ...todos.slice(0, lastIncompleteIndex + 1),
          newTodo,
          ...todos.slice(lastIncompleteIndex + 1)
        ];
      } else {
        newTodos = [newTodo, ...todos];
      }
    }
    
    // 重新计算order
    newTodos = newTodos.map((todo, index) => ({
      ...todo,
      order: index
    }));
    
    set({ todos: newTodos });
    
    // 保存到存储
    const data = loadData();
    saveData({ ...data, todos: newTodos });
  },
  
  updateTodo: (id: string, text: string) => {
    const { todos } = get();
    const newTodos = todos.map(todo =>
      todo.id === id ? { ...todo, text: text.trim() } : todo
    );
    set({ todos: newTodos });
    
    // 保存到存储
    const data = loadData();
    saveData({ ...data, todos: newTodos });
  },
  
  toggleTodo: (id: string) => {
    const { todos } = get();
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex === -1) return;
    
    const todo = todos[todoIndex];
    const updatedTodo = {
      ...todo,
      completed: !todo.completed,
      completedAt: !todo.completed ? new Date().toISOString() : null
    };
    
    let newTodos = [...todos];
    newTodos[todoIndex] = updatedTodo;
    
    // 如果标记为完成，移动到已完成区域的顶部
    if (updatedTodo.completed) {
      newTodos = [
        ...newTodos.filter(t => !t.completed),
        ...newTodos.filter(t => t.completed)
      ];
    } else {
      // 如果取消完成，移动到未完成区域的底部
      const incompleteTodos = newTodos.filter(t => !t.completed);
      const completedTodos = newTodos.filter(t => t.completed);
      newTodos = [...incompleteTodos, ...completedTodos];
    }
    
    // 重新计算order
    newTodos = newTodos.map((todo, index) => ({
      ...todo,
      order: index
    }));
    
    set({ todos: newTodos });
    
    // 保存到存储
    const data = loadData();
    saveData({ ...data, todos: newTodos });
  },
  
  deleteTodo: (id: string) => {
    const { todos } = get();
    const newTodos = todos.filter(todo => todo.id !== id).map((todo, index) => ({
      ...todo,
      order: index
    }));
    set({ todos: newTodos });
    
    // 保存到存储
    const data = loadData();
    saveData({ ...data, todos: newTodos });
  },
  
  reorderTodos: (startIndex: number, endIndex: number) => {
    const { todos } = get();
    const newTodos = [...todos];
    const [removed] = newTodos.splice(startIndex, 1);
    newTodos.splice(endIndex, 0, removed);
    
    // 重新计算order
    const reorderedTodos = newTodos.map((todo, index) => ({
      ...todo,
      order: index
    }));
    
    set({ todos: reorderedTodos });
    
    // 保存到存储
    const data = loadData();
    saveData({ ...data, todos: reorderedTodos });
  },
  
  toggleShowCompleted: () => {
    set(state => ({ showCompleted: !state.showCompleted }));
  },
  
  insertAfter: (afterId: string, beforeText: string, afterText: string) => {
    const { todos } = get();
    const trimmedBeforeText = beforeText.trim();
    const trimmedAfterText = afterText.trim();
    
    // 找到要分割的任务
    const index = todos.findIndex(t => t.id === afterId);
    if (index === -1) return '';
    
    // 创建新任务
    const newTodoId = `todo_${Date.now()}`;
    const newTodo: Todo = {
      id: newTodoId,
      text: trimmedAfterText,
      completed: false,
      order: 0,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    
    // 更新原任务的文本
    const updatedTodos = [...todos];
    updatedTodos[index] = {
      ...updatedTodos[index],
      text: trimmedBeforeText
    };
    
    // 在原任务后插入新任务
    const newTodos = [
      ...updatedTodos.slice(0, index + 1),
      newTodo,
      ...updatedTodos.slice(index + 1)
    ];
    
    // 重新计算order
    const reorderedTodos = newTodos.map((todo, idx) => ({
      ...todo,
      order: idx
    }));
    
    set({ todos: reorderedTodos });
    
    // 保存到存储
    const data = loadData();
    saveData({ ...data, todos: reorderedTodos });
    
    return newTodoId;
  }
}));
