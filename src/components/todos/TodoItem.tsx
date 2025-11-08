import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, GripVertical, Trash2 } from 'lucide-react';
import { Todo } from '../../types';
import { useTodoListContext } from '../../contexts/TodoListContext';

interface TodoItemProps {
  todo: Todo;
  isNewItem?: boolean;
  onUpdate: (id: string, text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNew?: (text: string, afterId: string) => void;
  onFocus?: () => void;
  onInsertAfter?: (afterId: string, beforeText: string, afterText: string) => void;
  shouldFocus?: boolean;
  onFocusHandled?: () => void;
  allowAutoFocus?: boolean;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  isNewItem = false,
  onUpdate,
  onToggle,
  onDelete,
  onAddNew,
  onFocus,
  onInsertAfter,
  shouldFocus,
  onFocusHandled,
  allowAutoFocus = true
}) => {
  const { getItemState, setItemState } = useTodoListContext();
  const itemState = getItemState(todo.id);
  
  // 从状态机派生编辑状态
  const isEditing = isNewItem || itemState === 'editing';
  
  const [text, setText] = useState(todo.text);
  const [showDelete, setShowDelete] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
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
    if (allowAutoFocus && isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      // 初始化时调整高度
      adjustTextareaHeight();
    }
  }, [allowAutoFocus, isEditing, adjustTextareaHeight]);

  // 监听文本变化，自动调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [text, adjustTextareaHeight]);

  // 处理shouldFocus
  useEffect(() => {
    if (shouldFocus && !isNewItem) {
      // 设置状态机为编辑状态
      setItemState(todo.id, 'editing');
      setWasEmptyNewItem(true);
      setTimeout(() => {
        inputRef.current?.focus();
        onFocusHandled?.();
      }, 0);
    }
  }, [shouldFocus, isNewItem, todo.id, setItemState, onFocusHandled]);

  // 使用原生事件监听器处理触摸滑动，避免passive event listener警告
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isEditing || isNewItem) return;

    const handleTouchStartNative = (e: TouchEvent) => {
      if (!isNewItem && getItemState(todo.id) === 'idle') {
        touchStartX.current = e.touches[0].clientX;
        touchEndX.current = e.touches[0].clientX;
        isSwipping.current = false;
      }
    };

    const handleTouchMoveNative = (e: TouchEvent) => {
      const itemState = getItemState(todo.id);
      if (!isNewItem && (itemState === 'idle' || itemState === 'swiping')) {
        touchEndX.current = e.touches[0].clientX;
        const swipeDistance = touchStartX.current - touchEndX.current;
        
        if (Math.abs(swipeDistance) > 5) {
          if (!isSwipping.current) {
            isSwipping.current = true;
            setItemState(todo.id, 'swiping');
          }
          e.preventDefault();
        }
        
        if (isSwipping.current) {
          const maxLeftSwipe = 80;
          const maxRightSwipe = 20;
          
          if (swipeDistance > 0) {
            setSwipeOffset(-Math.min(swipeDistance, maxLeftSwipe));
          } else {
            setSwipeOffset(-Math.max(swipeDistance, -maxRightSwipe));
          }
        }
      }
    };

    const handleTouchEndNative = () => {
      const swipeDistance = touchStartX.current - touchEndX.current;
      const containerWidth = container.offsetWidth || 0;
      const swipePercentage = Math.abs(swipeDistance) / containerWidth;
      
      if (isSwipping.current) {
        if (swipePercentage > 0.2) {
          if (swipeDistance > 0) {
            setSwipeOffset(-80);
            setShowDelete(true);
          } else {
            setSwipeOffset(0);
            setShowDelete(false);
          }
        } else {
          if (showDelete) {
            setSwipeOffset(-80);
          } else {
            setSwipeOffset(0);
          }
        }
        
        if (!isNewItem) {
          setItemState(todo.id, 'idle');
        }
      }
      
      isSwipping.current = false;
    };

    container.addEventListener('touchstart', handleTouchStartNative);
    container.addEventListener('touchmove', handleTouchMoveNative, { passive: false });
    container.addEventListener('touchend', handleTouchEndNative);

    return () => {
      container.removeEventListener('touchstart', handleTouchStartNative);
      container.removeEventListener('touchmove', handleTouchMoveNative);
      container.removeEventListener('touchend', handleTouchEndNative);
    };
  }, [isEditing, isNewItem, todo.id, showDelete, getItemState, setItemState]);

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
      // 在删除前先重置状态机
      setItemState(todo.id, 'idle');
      setWasEmptyNewItem(false);
      onDelete(todo.id);
      return;
    } else if (!isNewItem) {
      // 恢复原文本
      setText(todo.text);
    }
    
    if (!isNewItem) {
      // 退出编辑模式 - 重置状态机
      setItemState(todo.id, 'idle');
      setWasEmptyNewItem(false);
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
          
          // 关键：退出编辑模式，重置状态机
          setItemState(todo.id, 'idle');
        } else {
          handleSave();
        }
      }
    } else if (e.key === 'Escape') {
      setText(isNewItem ? '' : todo.text);
      // 退出编辑模式 - 重置状态机
      if (!isNewItem) {
        setItemState(todo.id, 'idle');
      }
    }
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

  const handleToggle = () => {
    if (!todo.completed) {
      // 从未完成到完成：播放淡出动画
      setIsCompleting(true);
      setTimeout(() => {
        onToggle(todo.id);
        setIsCompleting(false);
      }, 300); // 动画时长
    } else {
      // 从完成到未完成：直接更新状态
      onToggle(todo.id);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 transition-all duration-300 ease-out ${
        isDeleting
          ? 'opacity-0 translate-y-2'
          : isCompleting
          ? 'opacity-0 scale-95'
          : 'opacity-100 translate-y-0'
      }`}
      style={{
        transform: `translateX(${swipeOffset}px) ${isDeleting ? 'translateY(8px)' : ''}`
      }}
    >
      {/* 复选框 */}
      {!isNewItem ? (
        <button
          onClick={handleToggle}
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
              // 只有在idle状态时才能进入编辑
              if (!isNewItem && itemState === 'idle') {
                // 设置状态机为编辑状态
                setItemState(todo.id, 'editing');
                // 开始编辑时隐藏删除按钮和重置滑动状态
                setShowDelete(false);
                setSwipeOffset(0);
                // 关键修复：在下一个tick调整高度
                setTimeout(() => {
                  adjustTextareaHeight();
                  inputRef.current?.select();
                }, 0);
              }
              // 新建项不需要处理，因为它始终是编辑状态
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
          className={`flex-shrink-0 p-1 text-red-500 hover:bg-red-50 rounded transition-opacity hidden md:block ${
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
