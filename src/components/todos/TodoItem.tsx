import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Todo } from '../../types';

interface TodoItemProps {
  todo: Todo;
  isNewItem?: boolean;
  onUpdate: (id: string, text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNew?: (text: string, afterId: string) => void;
  onFocus?: () => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  isNewItem = false,
  onUpdate,
  onToggle,
  onDelete,
  onAddNew,
  onFocus
}) => {
  const [isEditing, setIsEditing] = useState(isNewItem);
  const [text, setText] = useState(todo.text);
  const [showDelete, setShowDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedText = text.trim();
    
    if (isNewItem && trimmedText) {
      // 新任务
      onAddNew?.(trimmedText, todo.id);
      setText('');
    } else if (!isNewItem && trimmedText && trimmedText !== todo.text) {
      // 更新现有任务
      onUpdate(todo.id, trimmedText);
    } else if (!isNewItem) {
      // 恢复原文本
      setText(todo.text);
    }
    
    if (!isNewItem) {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (isNewItem) {
        const trimmedText = text.trim();
        if (trimmedText) {
          onAddNew?.(trimmedText, todo.id);
          setText('');
          // 保持焦点在输入框
          setTimeout(() => {
            inputRef.current?.focus();
          }, 0);
        }
      } else {
        handleSave();
      }
    } else if (e.key === 'Escape') {
      setText(isNewItem ? '' : todo.text);
      setIsEditing(false);
    }
  };

  // 处理触摸事件（左滑删除）
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    if (swipeDistance > 50) {
      // 左滑超过50px显示删除
      setShowDelete(true);
    } else if (swipeDistance < -50) {
      // 右滑隐藏删除
      setShowDelete(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 transition-all ${
        showDelete ? 'translate-x-[-80px]' : ''
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 复选框 */}
      {!isNewItem ? (
        <button
          onClick={() => onToggle(todo.id)}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
            todo.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {todo.completed && (
            <Check className="w-3 h-3 text-white m-auto" />
          )}
        </button>
      ) : (
        <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-200" />
      )}

      {/* 任务文本 */}
      <div className="flex-1">
        {isEditing || isNewItem ? (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
              if (!isNewItem) {
                handleSave();
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            placeholder={isNewItem ? "添加新任务..." : ""}
            className="w-full px-2 py-1 text-gray-700 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className={`cursor-pointer ${
              todo.completed
                ? 'text-gray-400 line-through'
                : 'text-gray-700'
            }`}
          >
            {todo.text}
          </div>
        )}
      </div>

      {/* 删除按钮（桌面端悬停显示） */}
      {!isNewItem && (
        <button
          onClick={() => onDelete(todo.id)}
          className={`flex-shrink-0 p-1 text-red-500 hover:bg-red-50 rounded transition-opacity ${
            showDelete ? 'opacity-100' : 'opacity-0 hover:opacity-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* 滑动删除按钮（移动端） */}
      {!isNewItem && showDelete && (
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center">
          <button
            onClick={() => {
              onDelete(todo.id);
              setShowDelete(false);
            }}
            className="text-white font-medium"
          >
            删除
          </button>
        </div>
      )}
    </div>
  );
};
