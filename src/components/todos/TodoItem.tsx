import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, GripVertical, Trash2 } from 'lucide-react';
import { Todo } from '../../types';

interface TodoItemProps {
  todo: Todo;
  isNewItem?: boolean;
  isAnyItemEditing: boolean;
  setIsAnyItemEditing: (editing: boolean) => void;
  onUpdate: (id: string, text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNew?: (text: string, afterId: string) => void;
  onFocus?: () => void;
  onInsertAfter?: (afterId: string, beforeText: string, afterText: string) => void;
  shouldFocus?: boolean;
  onFocusHandled?: () => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  isNewItem = false,
  isAnyItemEditing,
  setIsAnyItemEditing,
  onUpdate,
  onToggle,
  onDelete,
  onAddNew,
  onFocus,
  onInsertAfter,
  shouldFocus,
  onFocusHandled
}) => {
  const [isEditing, setIsEditing] = useState(isNewItem);
  const [text, setText] = useState(todo.text);
  const [showDelete, setShowDelete] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [wasEmptyNewItem, setWasEmptyNewItem] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwipping = useRef(false);

  // 自动调整 textarea 高度的函数
  const adjustTextareaHeight = useCallback(() => {
    if (inputRef.current) {
      // 先重置高度为 auto 以获取准确的 scrollHeight
      inputRef.current.style.height = 'auto';
      // 设置高度为内容高度
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      setIsAnyItemEditing(true);
      // 初始化时调整高度
      adjustTextareaHeight();
    }
    // 移除了 else if 分支，避免错误地重置全局编辑状态
  }, [isEditing, setIsAnyItemEditing, adjustTextareaHeight]);

  // 监听文本变化，自动调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [text, adjustTextareaHeight]);

  // 处理shouldFocus
  useEffect(() => {
    if (shouldFocus && !isNewItem) {
      setIsEditing(true);
      setWasEmptyNewItem(true);
      setTimeout(() => {
        inputRef.current?.focus();
        onFocusHandled?.();
      }, 0);
    }
  }, [shouldFocus, isNewItem, onFocusHandled]);

  const handleSave = () => {
    const trimmedText = text.trim();
    
    if (isNewItem && trimmedText) {
      // 新任务
      onAddNew?.(trimmedText, todo.id);
      setText('');
    } else if (!isNewItem && trimmedText && trimmedText !== todo.text) {
      // 更新现有任务
      onUpdate(todo.id, trimmedText);
    } else if (!isNewItem && !trimmedText && wasEmptyNewItem) {
      // 如果是通过回车创建的新item且内容为空，删除它
      // 在删除前先重置状态，避免isAnyItemEditing被卡住
      setIsEditing(false);
      setWasEmptyNewItem(false);
      setIsAnyItemEditing(false);  // 直接重置全局编辑状态
      onDelete(todo.id);
      return;
    } else if (!isNewItem) {
      // 恢复原文本
      setText(todo.text);
    }
    
    if (!isNewItem) {
      setIsEditing(false);
      setWasEmptyNewItem(false);
      // 退出编辑模式时重置全局编辑状态
      setIsAnyItemEditing(false);
      // 编辑完成时隐藏删除按钮和重置滑动状态
      setShowDelete(false);
      setSwipeOffset(0);
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
        // 对于现有item，获取光标位置并分割文本
        if (inputRef.current && onInsertAfter) {
          const cursorPosition = inputRef.current.selectionStart;
          const beforeText = text.substring(0, cursorPosition);
          const afterText = text.substring(cursorPosition);
          
          // 保存当前item的前半部分文本，并在其后插入新item包含后半部分文本
          onInsertAfter(todo.id, beforeText, afterText);
          
          // 立即更新当前组件的显示文本为截断后的文本
          setText(beforeText);
        } else {
          handleSave();
        }
      }
    } else if (e.key === 'Escape') {
      setText(isNewItem ? '' : todo.text);
      setIsEditing(false);
    }
  };

  // 处理触摸事件（左滑删除）
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isSwipping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    const swipeDistance = touchStartX.current - touchEndX.current;
    
    // 如果开始滑动，标记为滑动状态
    if (Math.abs(swipeDistance) > 5) {
      isSwipping.current = true;
      e.preventDefault();
    }
    
    // 实时更新滑动偏移，但限制滑动范围
    if (isSwipping.current) {
      // 左滑最多80px（删除按钮宽度），右滑最多20px
      const maxLeftSwipe = 80;
      const maxRightSwipe = 20;
      
      if (swipeDistance > 0) {
        // 左滑
        setSwipeOffset(-Math.min(swipeDistance, maxLeftSwipe));
      } else {
        // 右滑
        setSwipeOffset(-Math.max(swipeDistance, -maxRightSwipe));
      }
    }
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const swipePercentage = Math.abs(swipeDistance) / containerWidth;
    
    if (isSwipping.current) {
      // 如果滑动距离超过容器宽度的20%，则显示/隐藏删除按钮
      if (swipePercentage > 0.2) {
        if (swipeDistance > 0) {
          // 左滑显示删除，固定在-80px位置
          setSwipeOffset(-80);
          setShowDelete(true);
        } else {
          // 右滑隐藏删除，回到原位
          setSwipeOffset(0);
          setShowDelete(false);
        }
      } else {
        // 滑动距离不够，回弹到当前状态
        if (showDelete) {
          setSwipeOffset(-80);
        } else {
          setSwipeOffset(0);
        }
      }
    }
    
    isSwipping.current = false;
  };

  const handleDeleteClick = () => {
    setIsPressed(true);
    setIsDeleting(true);
    
    // 删除动画后执行实际删除
    setTimeout(() => {
      onDelete(todo.id);
      setShowDelete(false);
    }, 300);
  };

  return (
    <div
      ref={containerRef}
      className={`flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 transition-all duration-300 ease-out ${
        isDeleting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
      style={{
        transform: `translateX(${swipeOffset}px) ${isDeleting ? 'translateY(8px)' : ''}`
      }}
      onTouchStart={!isEditing && !isNewItem ? handleTouchStart : undefined}
      onTouchMove={!isEditing && !isNewItem ? handleTouchMove : undefined}
      onTouchEnd={!isEditing && !isNewItem ? handleTouchEnd : undefined}
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
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              adjustTextareaHeight();
            }}
            onBlur={() => {
              // 失去焦点时自动保存（无论是新任务还是编辑任务）
              handleSave();
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              // 编辑现有任务时不触发onFocus回调，避免创建新输入框
              if (isNewItem) {
                onFocus?.();
              }
            }}
            placeholder={isNewItem ? "添加新任务..." : ""}
            className="w-full px-2 py-1 text-gray-700 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none resize-none overflow-hidden"
            rows={1}
          />
        ) : (
          <div
            onClick={() => {
              // 只有当没有其他项在编辑时才允许进入编辑状态
              if (!isAnyItemEditing) {
                setIsEditing(true);
                // 开始编辑时隐藏删除按钮和重置滑动状态
                setShowDelete(false);
                setSwipeOffset(0);
              }
            }}
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

      {/* 拖动图标 */}
      {!isNewItem && !todo.completed && (
        <div className="flex-shrink-0 p-1 text-gray-400 cursor-move">
          <GripVertical className="w-4 h-4" />
        </div>
      )}

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
        <div 
          className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#FF6B6B] to-[#FF4757] flex flex-col items-center justify-center transition-all duration-200"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
            transform: isPressed ? 'scale(0.95)' : 'scale(1)',
            background: isPressed ? 'linear-gradient(to right, #FF5252, #FF3838)' : ''
          }}
        >
          <button
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            onClick={handleDeleteClick}
            className="flex flex-col items-center justify-center w-full h-full"
          >
            <Trash2 className="w-5 h-5 text-white mb-1" />
            <span className="text-xs text-white font-medium">删除</span>
          </button>
        </div>
      )}
    </div>
  );
};
