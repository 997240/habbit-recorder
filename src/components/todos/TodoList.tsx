import React, { useState, useRef } from 'react';
import { TodoItem } from './TodoItem';
import { Todo } from '../../types';

interface TodoListProps {
  todos: Todo[];
  showCompleted: boolean;
  onUpdate: (id: string, text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (text: string, afterId?: string) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onInsertAfter?: (afterId: string, beforeText: string, afterText: string) => string;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  showCompleted,
  onUpdate,
  onToggle,
  onDelete,
  onAdd,
  onReorder,
  onInsertAfter
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [newInputAfterItemId, setNewInputAfterItemId] = useState<string | null>(null);
  const [isAnyItemEditing, setIsAnyItemEditing] = useState(false);
  const [focusNewItemId, setFocusNewItemId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);

  // 过滤显示的任务
  const displayTodos = showCompleted 
    ? todos 
    : todos.filter(todo => !todo.completed);

  // 创建一个用于新任务输入的虚拟todo
  const newTodoItem: Todo = {
    id: 'new_todo',
    text: '',
    completed: false,
    order: displayTodos.length,
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  // 在指定项后或末尾插入新输入框
  const todosWithInput = (): (Todo & { isInput?: boolean })[] => {
    const result: (Todo & { isInput?: boolean })[] = [];
    let inputAdded = false;

    displayTodos.forEach((todo) => {
      result.push(todo);
      
      // 在指定项后添加输入框
      if (newInputAfterItemId === todo.id) {
        result.push({ ...newTodoItem, id: `new_${todo.id}`, isInput: true });
        inputAdded = true;
      }
    });

    // 如果没有指定项或列表为空，在末尾添加输入框
    if (!inputAdded) {
      result.push({ ...newTodoItem, isInput: true });
    }

    return result;
  };

  // 处理长按开始拖拽
  const handleLongPress = (index: number) => {
    if (displayTodos[index]?.completed) return; // 已完成任务不能拖拽
    
    longPressTimer.current = setTimeout(() => {
      setDraggedIndex(index);
      isDragging.current = true;
    }, 500); // 500ms后开始拖拽
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isDragging.current && draggedIndex !== null && dragOverIndex !== null) {
      if (draggedIndex !== dragOverIndex) {
        const draggedTodo = displayTodos[draggedIndex];
        const targetTodo = displayTodos[dragOverIndex];
        
        // 只允许未完成任务之间的重新排序
        if (!draggedTodo?.completed && !targetTodo?.completed) {
          onReorder(draggedIndex, dragOverIndex);
        }
      }
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    isDragging.current = false;
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (displayTodos[index]?.completed) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    // 如果目标是已完成任务，不允许放置
    if (displayTodos[index]?.completed) return;
    
    // 如果正在拖动未完成任务，只允许在未完成任务区域内排序
    if (draggedIndex !== null) {
      const draggedTodo = displayTodos[draggedIndex];
      const targetTodo = displayTodos[index];
      
      // 只有当拖动的是未完成任务且目标也是未完成任务时才允许
      if (!draggedTodo?.completed && !targetTodo?.completed) {
        setDragOverIndex(index);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== index) {
      const draggedTodo = displayTodos[draggedIndex];
      const targetTodo = displayTodos[index];
      
      // 只允许未完成任务之间的重新排序
      if (!draggedTodo?.completed && !targetTodo?.completed) {
        onReorder(draggedIndex, index);
      }
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {todosWithInput().map((todo) => {
        const isNewInput = todo.isInput;
        const actualIndex = isNewInput ? -1 : displayTodos.findIndex(t => t.id === todo.id);
        
        return (
          <div
            key={todo.id}
            draggable={!isNewInput && !todo.completed}
            onDragStart={(e) => !isNewInput && handleDragStart(e, actualIndex)}
            onDragOver={(e) => !isNewInput && handleDragOver(e, actualIndex)}
            onDrop={(e) => !isNewInput && handleDrop(e, actualIndex)}
            onTouchStart={() => !isNewInput && handleLongPress(actualIndex)}
            onTouchEnd={handleTouchEnd}
            className={`
              ${draggedIndex === actualIndex ? 'opacity-50' : ''}
              ${dragOverIndex === actualIndex ? 'border-t-2 border-blue-500' : ''}
              ${!isNewInput && !todo.completed ? 'cursor-move' : ''}
            `}
          >
            <TodoItem
              todo={todo}
              isNewItem={isNewInput}
              isAnyItemEditing={isAnyItemEditing}
              setIsAnyItemEditing={setIsAnyItemEditing}
              onUpdate={onUpdate}
              onToggle={onToggle}
              onDelete={onDelete}
              onAddNew={(text, afterId) => {
                onAdd(text, afterId === 'new_todo' ? undefined : afterId.replace('new_', ''));
                // 在新创建的任务后继续显示输入框
                const prevTodoId = afterId.replace('new_', '');
                if (prevTodoId !== 'todo') {
                  // 创建任务后，在该任务后继续显示输入框
                  setNewInputAfterItemId(prevTodoId);
                }
              }}
              onFocus={() => {
                // 只有新输入框获得焦点时才设置位置
                if (isNewInput) {
                  // 当前输入框获得焦点，清除其他位置的输入框
                  const currentAfterItemId = todo.id.startsWith('new_') 
                    ? todo.id.replace('new_', '') 
                    : null;
                  
                  if (currentAfterItemId && currentAfterItemId !== 'todo') {
                    setNewInputAfterItemId(currentAfterItemId);
                  } else {
                    setNewInputAfterItemId(null);
                  }
                }
              }}
              onInsertAfter={(afterId, beforeText, afterText) => {
                if (onInsertAfter) {
                  const newId = onInsertAfter(afterId, beforeText, afterText);
                  // 设置新item需要聚焦
                  if (newId) {
                    setFocusNewItemId(newId);
                  }
                }
              }}
              shouldFocus={focusNewItemId === todo.id}
              onFocusHandled={() => setFocusNewItemId(null)}
            />
          </div>
        );
      })}
    </div>
  );
};
