import React, { useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TodoList } from './TodoList';
import { useTodoStore } from '../../stores/todoStore';

export const TodoPage: React.FC = () => {
  const {
    todos,
    showCompleted,
    loadTodos,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    reorderTodos,
    toggleShowCompleted,
    insertAfter
  } = useTodoStore();

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const completedCount = todos.filter(t => t.completed).length;
  const incompleteCount = todos.filter(t => !t.completed).length;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">待办事项</h1>
            <p className="text-sm text-gray-500 mt-1">
              {incompleteCount} 个待完成
              {completedCount > 0 && `，${completedCount} 个已完成`}
            </p>
          </div>
          
          {/* 显示/隐藏已完成开关 */}
          <button
            onClick={toggleShowCompleted}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              showCompleted
                ? 'bg-blue-50 text-blue-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {showCompleted ? (
              <>
                <Eye className="w-4 h-4" />
                <span className="text-sm">显示已完成</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                <span className="text-sm">隐藏已完成</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 任务列表 */}
      <TodoList
        todos={todos}
        showCompleted={showCompleted}
        onUpdate={updateTodo}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
        onAdd={addTodo}
        onReorder={reorderTodos}
        onInsertAfter={insertAfter}
      />
    </div>
  );
};
