import React, { createContext, useState, useContext, useCallback } from 'react';
import { TodoItemState } from '../hooks/useTodoItemState';

interface TodoListContextType {
  getItemState: (id: string) => TodoItemState;
  setItemState: (id: string, state: TodoItemState) => void;
  hasAnyItemInState: (state: TodoItemState) => boolean;
}

const TodoListContext = createContext<TodoListContextType | null>(null);

export const useTodoListContext = () => {
  const context = useContext(TodoListContext);
  if (!context) {
    throw new Error('useTodoListContext must be used within TodoListProvider');
  }
  return context;
};

export const TodoListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [itemStates, setItemStates] = useState<Map<string, TodoItemState>>(new Map());
  
  const getItemState = useCallback((id: string) => {
    return itemStates.get(id) || 'idle';
  }, [itemStates]);
  
  const setItemState = useCallback((id: string, state: TodoItemState) => {
    setItemStates(prev => {
      const newMap = new Map(prev);
      if (state === 'idle') {
        // 如果设置为idle，可以删除该项以节省内存
        newMap.delete(id);
      } else {
        newMap.set(id, state);
      }
      return newMap;
    });
  }, []);
  
  const hasAnyItemInState = useCallback((state: TodoItemState) => {
    if (state === 'idle') {
      // 所有未在Map中的项都是idle状态
      return false;
    }
    return Array.from(itemStates.values()).includes(state);
  }, [itemStates]);
  
  return (
    <TodoListContext.Provider value={{ getItemState, setItemState, hasAnyItemInState }}>
      {children}
    </TodoListContext.Provider>
  );
};
