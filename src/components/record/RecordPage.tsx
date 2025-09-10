import React, { useState } from 'react';
import { Calendar, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Habit, HabitRecord } from '../../types';
import { formatDate, formatDisplayDate } from '../../utils/dateUtils';

interface RecordPageProps {
  habits: Habit[];
  records: HabitRecord[];
  onSaveRecord: (record: Omit<HabitRecord, 'id' | 'createdAt'>) => void;
}

export const RecordPage: React.FC<RecordPageProps> = ({ habits, records, onSaveRecord }) => {
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [recordValues, setRecordValues] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const activeHabits = habits.filter(habit => habit.isActive);

  // Load existing records for the selected date
  React.useEffect(() => {
    const existingRecords = records.filter(record => record.date === selectedDate);
    const values: Record<string, any> = {};
    const existingNotes: Record<string, string> = {};

    existingRecords.forEach(record => {
      values[record.habitId] = record.value;
      if (record.note) {
        existingNotes[record.habitId] = record.note;
      }
    });

    setRecordValues(values);
    setNotes(existingNotes);
  }, [selectedDate, records]);

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(formatDate(newDate));
  };

  const handleSaveAll = () => {
    let savedCount = 0;
    
    activeHabits.forEach(habit => {
      const value = recordValues[habit.id];
      if (value !== undefined && value !== '' && value !== false) {
        onSaveRecord({
          habitId: habit.id,
          userId: habit.userId,
          date: selectedDate,
          value: value,
          note: notes[habit.id] || undefined
        });
        savedCount++;
      }
    });

    if (savedCount > 0) {
      alert(`已为 ${formatDisplayDate(selectedDate)} 保存 ${savedCount} 条习惯记录`);
    }
  };

  const renderHabitInput = (habit: Habit) => {
    const value = recordValues[habit.id];

    switch (habit.type) {
      case 'numeric':
        return (
          <input
            type="number"
            min="0"
            step="0.1"
            value={value || ''}
            onChange={(e) => setRecordValues({ ...recordValues, [habit.id]: Number(e.target.value) || 0 })}
            placeholder="输入数值"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'duration':
        return (
          <input
            type="number"
            min="0"
            step="1"
            value={value || ''}
            onChange={(e) => setRecordValues({ ...recordValues, [habit.id]: Number(e.target.value) || 0 })}
            placeholder="输入时长"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'time-based':
        return (
          <input
            type="time"
            value={value || ''}
            onChange={(e) => setRecordValues({ ...recordValues, [habit.id]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'check-in':
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => setRecordValues({ ...recordValues, [habit.id]: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">已完成</span>
          </label>
        );

      default:
        return null;
    }
  };

  const getHabitSummary = (habit: Habit) => {
    if (habit.target) {
      return `目标：${habit.target}${habit.unit ? ` ${habit.unit}` : ''}`;
    }
    return habit.unit ? `单位：${habit.unit}` : '';
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">记录习惯</h1>
        <p className="text-gray-600">追踪您的每日进度，培养持久的习惯。</p>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">记录日期</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDateChange('prev')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-lg font-medium text-gray-900 px-4">
              {formatDisplayDate(selectedDate)}
            </span>
            <button
              onClick={() => handleDateChange('next')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={formatDate(new Date())}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Habits List */}
      {activeHabits.length > 0 ? (
        <div className="space-y-6 mb-8">
          {activeHabits.map((habit) => (
            <div key={habit.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{habit.name}</h3>
                <p className="text-sm text-gray-600">{getHabitSummary(habit)}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    数值
                  </label>
                  {renderHabitInput(habit)}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    备注（可选）
                  </label>
                  <input
                    type="text"
                    value={notes[habit.id] || ''}
                    onChange={(e) => setNotes({ ...notes, [habit.id]: e.target.value })}
                    placeholder="添加备注..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Save Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
            >
              <Save className="w-4 h-4" />
              保存所有记录
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无活跃习惯</h3>
          <p className="text-gray-600">请先创建一些习惯来开始记录您的进度。</p>
        </div>
      )}
    </div>
  );
};