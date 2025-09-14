import React, { useState, useEffect, useRef } from 'react';
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
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  showCompleted,
  onUpdate,
  onToggle,
  onDelete,
  onAdd,
  onReorder
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
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

  // 如果有焦点项，在其后插入新输入框
  const todosWithInput = (): (Todo & { isInput?: boolean })[] => {
    const result: (Todo & { isInput?: boolean })[] = [];
    let inputAdded = false;

    displayTodos.forEach((todo, index) => {
      result.push(todo);
      
      // 在焦点项后添加输入框
      if (focusedItemId === todo.id) {
        result.push({ ...newTodoItem, id: `new_${todo.id}`, isInput: true });
        inputAdded = true;
      }
    });

    // 如果没有焦点项或列表为空，在末尾添加输入框
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
        onReorder(draggedIndex, dragOverIndex);
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
    if (displayTodos[index]?.completed) return;
    
    if (draggedIndex !== null) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {todosWithInput().map((todo, index) => {
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
              onUpdate={onUpdate}
              onToggle={onToggle}
              onDelete={onDelete}
              onAddNew={(text, afterId) => {
                onAdd(text, afterId === 'new_todo' ? undefined : afterId.replace('new_', ''));
                // 设置焦点到新创建任务的前一个任务
                const prevTodoId = afterId.replace('new_', '');
                if (prevTodoId !== 'todo') {
                  setFocusedItemId(prevTodoId);
                }
              }}
              onFocus={() => {
                if (!isNewInput) {
                  setFocusedItemId(todo.id);
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
