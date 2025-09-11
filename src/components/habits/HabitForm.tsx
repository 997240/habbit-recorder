import React, { useState, useEffect } from 'react';
import { X, Save, Target as TargetIcon } from 'lucide-react';
import { Habit, HabitType } from '../../types';

interface HabitFormProps {
  habit?: Habit;
  onSave: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const HabitForm: React.FC<HabitFormProps> = ({ habit, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'numeric' as HabitType,
    unit: '',
    target: '',
    isActive: true
  });

  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name,
        type: habit.type,
        unit: habit.unit || '',
        target: habit.target?.toString() || '',
        isActive: habit.isActive
      });
    }
  }, [habit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // 验证目标字段（排除check-in类型）
    if (formData.type !== 'check-in' && !formData.target.trim()) return;

    const habitData = {
      name: formData.name.trim(),
      type: formData.type,
      unit: formData.unit.trim() || undefined,
      target: formData.target ? (formData.type === 'time-based' ? formData.target : Number(formData.target)) : undefined,
      isActive: formData.isActive
    };

    onSave(habitData);
  };

  const habitTypes = [
    { value: 'numeric', label: '数值', description: '追踪数字（如：俯卧撑、深蹲、番茄钟次数）' },
    { value: 'duration', label: '时长', description: '追踪花费的时间（如：冥想、锻炼、瑜伽）' },
    { value: 'time-based', label: '时间点', description: '追踪特定的时间[睡眠记录]（如：睡觉、起床）' },
    { value: 'check-in', label: '签到', description: '简单的完成与否追踪（如：是否喝牛奶、吃苹果）' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TargetIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {habit ? '编辑习惯' : '新建习惯'}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Habit Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                习惯名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：晨练、阅读书籍"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>

            {/* Habit Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                习惯类型 *
              </label>
              <div className="grid gap-3">
                {habitTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as HabitType })}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Unit (for numeric and duration types) */}
            {(formData.type === 'numeric' || formData.type === 'duration') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  单位
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder={formData.type === 'numeric' ? '例如：次、页、杯' : '例如：分钟、小时'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            )}

            {/* Target */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'check-in' ? '每日目标（签到类型无需设置）' : '每日目标 *'}
              </label>
              {formData.type === 'time-based' ? (
                <input
                  type="time"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              ) : formData.type !== 'check-in' ? (
                <input
                  type="number"
                  min="0"
                  step={formData.type === 'duration' ? '1' : '0.1'}
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  placeholder="输入目标值"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              ) : (
                <p className="text-sm text-gray-500 italic">签到类习惯不需要设置目标值。</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
              >
                <Save className="w-4 h-4" />
                {habit ? '更新' : '创建'}习惯
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};