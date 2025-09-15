import { useState, useCallback } from 'react';

// 定义交互状态
export type TodoItemState = 
  | 'idle'           // 空闲状态
  | 'editing'        // 编辑状态  
  | 'dragging'       // 拖拽状态
  | 'swiping';       // 滑动删除状态

// 状态转换规则
const stateTransitions: Record<TodoItemState, TodoItemState[]> = {
  idle: ['editing', 'dragging', 'swiping'],
  editing: ['idle'],
  dragging: ['idle'],  
  swiping: ['idle']
};

export const useTodoItemState = () => {
  const [state, setState] = useState<TodoItemState>('idle');
  
  const canTransitionTo = useCallback((newState: TodoItemState) => {
    return stateTransitions[state].includes(newState);
  }, [state]);
  
  const transitionTo = useCallback((newState: TodoItemState) => {
    if (canTransitionTo(newState)) {
      setState(newState);
      return true;
    }
    return false;
  }, [canTransitionTo]);
  
  return {
    state,
    transitionTo,
    isIdle: state === 'idle',
    isEditing: state === 'editing',
    isDragging: state === 'dragging',
    isSwiping: state === 'swiping'
  };
};
