import React, { useState } from 'react';
import { Plus, Edit3, Archive, Trash2, MoreHorizontal, Target as TargetIcon } from 'lucide-react';
import { Habit } from '../../types';

interface HabitListProps {
  habits: Habit[];
  onCreateHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onToggleActive: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitList: React.FC<HabitListProps> = ({
  habits,
  onCreateHabit,
  onEditHabit,
  onToggleActive,
  onDeleteHabit
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const activeHabits = habits.filter(habit => habit.isActive);
  const archivedHabits = habits.filter(habit => !habit.isActive);

  const getHabitTypeColor = (type: string) => {
    switch (type) {
      case 'numeric': return 'bg-blue-100 text-blue-700';
      case 'duration': return 'bg-green-100 text-green-700';
      case 'time-based': return 'bg-purple-100 text-purple-700';
      case 'check-in': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getHabitTypeLabel = (type: string) => {
    switch (type) {
      case 'numeric': return '数值型';
      case 'duration': return '计时型';
      case 'time-based': return '时间点型';
      case 'check-in': return '签到型';
      default: return type;
    }
  };

  const HabitCard: React.FC<{ habit: Habit; isArchived?: boolean }> = ({ habit }) => (
    <div className={`rounded-xl p-6 hover:shadow-lg transition-all duration-200 ${!habit.isActive ? 'bg-gray-50 border border-gray-200 opacity-90' : 'bg-white border border-gray-200'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!habit.isActive ? 'bg-gray-100' : 'bg-blue-100'}`}>
            <TargetIcon className={`w-5 h-5 ${!habit.isActive ? 'text-gray-500' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className={`font-semibold mb-1 ${!habit.isActive ? 'text-gray-700' : 'text-gray-900'}`}>{habit.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHabitTypeColor(habit.type)}`}>
              {getHabitTypeLabel(habit.type)}
            </span>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setActiveMenuId(activeMenuId === habit.id ? null : habit.id)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {activeMenuId === habit.id && (
            <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
              <button
                onClick={() => {
                  onEditHabit(habit);
                  setActiveMenuId(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={() => {
                  onToggleActive(habit.id);
                  setActiveMenuId(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                {habit.isActive ? '归档' : '恢复'}
              </button>
              <button
                onClick={() => {
                  if (confirm('确定要删除这个习惯吗？此操作无法撤销。')) {
                    onDeleteHabit(habit.id);
                    setActiveMenuId(null);
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {habit.unit && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">单位：</span> {habit.unit}
          </p>
        )}
        {habit.target && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">目标：</span> {habit.target}{habit.unit ? ` ${habit.unit}` : ''}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">习惯管理</h1>
          <p className="text-gray-600">创建和管理您的日常习惯和例行公事。</p>
        </div>
        <button
          onClick={onCreateHabit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          新建习惯
        </button>
      </div>

      {/* Active Habits */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          活跃习惯 ({activeHabits.length})
        </h2>
        {activeHabits.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {activeHabits.map(habit => (
              <HabitCard key={habit.id} habit={habit} isArchived={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <TargetIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无活跃习惯</h3>
            <p className="text-gray-600 mb-4">创建您的第一个习惯来开始追踪进度。</p>
            <button
              onClick={onCreateHabit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              创建习惯
            </button>
          </div>
        )}
      </div>

      {/* Archived Habits */}
      {archivedHabits.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            已归档习惯 ({archivedHabits.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {archivedHabits.map(habit => (
              <HabitCard key={habit.id} habit={habit} isArchived={true} />
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {activeMenuId && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={() => setActiveMenuId(null)}
        />
      )}
    </div>
  );
};