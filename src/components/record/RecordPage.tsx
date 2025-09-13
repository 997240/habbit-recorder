import React, { useState } from 'react';
import { Calendar, Save, ChevronLeft, ChevronRight, CheckCircle, Plus, Minus } from 'lucide-react';
import { Habit, HabitRecord } from '../../types';
import { formatDate, formatDisplayDate, generateId } from '../../utils/dateUtils';
import { useHabitStore } from '../../stores/habitStore';

export const RecordPage: React.FC = () => {
  // 使用 selector 精确订阅需要的状态
  const habits = useHabitStore(state => state.habits);
  const records = useHabitStore(state => state.records);
  const addMultipleRecords = useHabitStore(state => state.addMultipleRecords);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [recordValues, setRecordValues] = useState<Record<string, any>>({});
  // 为数值型和时长型习惯存储多个输入值
  const [multipleValues, setMultipleValues] = useState<Record<string, Array<{id: string, value: number | string}>>>({});
  const [notification, setNotification] = useState<{show: boolean; message: string}>({show: false, message: ''});

  const activeHabits = habits.filter(habit => habit.isActive);

  // Load existing records for the selected date
  React.useEffect(() => {
    const existingRecords = records.filter(record => record.date === selectedDate);
    const values: Record<string, any> = {};
    const multiples: Record<string, Array<{id: string, value: number | string}>> = {};

    existingRecords.forEach(record => {
      if (record.values && Array.isArray(record.values)) {
        // 新格式：多值记录
        const habit = habits.find(h => h.id === record.habitId);
        if (habit && (habit.type === 'numeric' || habit.type === 'duration')) {
          multiples[record.habitId] = record.values.map(v => ({
            id: v.id,
            value: v.value as number
          }));
        } else {
          // 对于时间点型和签到型，取第一个值
          values[record.habitId] = record.values[0]?.value;
        }
      } else {
        // 兼容旧格式
        values[record.habitId] = (record as any).value;
      }
    });

    setRecordValues(values);
    setMultipleValues(multiples);
  }, [selectedDate, habits]);

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(formatDate(newDate));
  };

  const handleSaveAll = () => {
    // 收集所有需要保存的记录
    const recordsToSave: Array<Omit<HabitRecord, 'id' | 'createdAt'>> = [];
    
    activeHabits.forEach(habit => {
      if (habit.type === 'numeric' || habit.type === 'duration') {
        // 处理多值记录
        const values = multipleValues[habit.id];
        const existingRecord = records.find(r => r.habitId === habit.id && r.date === selectedDate);
        
        if (values && values.length > 0) {
          // 修改过滤条件：允许值为0的记录被保存，只过滤空字符串
          const validValues = values.filter(v => v.value !== '');
          if (validValues.length > 0) {
            recordsToSave.push({
              habitId: habit.id,
              date: selectedDate,
              values: validValues.map(v => ({
                id: v.id,
                value: v.value,
                timestamp: new Date().toISOString()
              }))
            });
          }
        } else if (existingRecord) {
          // 用户删除了所有输入框但之前有记录，保存空值数组表示清零
          recordsToSave.push({
            habitId: habit.id,
            date: selectedDate,
            values: []
          });
        }
      } else {
        // 处理单值记录（时间点型和签到型）
        const value = recordValues[habit.id];
        if (value !== undefined && value !== '') {
          recordsToSave.push({
            habitId: habit.id,
            date: selectedDate,
            values: [{
              id: generateId(),
              value: value,
              timestamp: new Date().toISOString()
            }]
          });
        }
      }
    });

    if (recordsToSave.length > 0) {
      // 批量处理所有记录
      const newRecords: HabitRecord[] = recordsToSave.map(recordData => {
        // 检查是否已存在
        const existingRecord = records.find(
          r => r.habitId === recordData.habitId && r.date === recordData.date
        );
        
        // 创建新记录对象
        return {
          id: existingRecord ? existingRecord.id : generateId(),
          createdAt: existingRecord ? existingRecord.createdAt : new Date().toISOString(),
          ...recordData
        };
      });
      
      // 一次性保存所有记录
      addMultipleRecords(newRecords);
      // 显示友好的Tailwind提示，而不是弹窗
      setNotification({
        show: true, 
        message: `已为 ${formatDisplayDate(selectedDate)} 保存 ${recordsToSave.length} 条习惯记录`
      });
      
      // 3秒后自动隐藏提示
      setTimeout(() => {
        setNotification({show: false, message: ''});
      }, 3000);
    }
  };

  // 添加新输入框的函数
  const addInputField = (habitId: string) => {
    const currentValues = multipleValues[habitId] || [];
    const newValue = { id: generateId(), value: 0 };
    setMultipleValues({
      ...multipleValues,
      [habitId]: [...currentValues, newValue]
    });
  };

  // 删除输入框的函数
  const removeInputField = (habitId: string, valueId: string) => {
    const currentValues = multipleValues[habitId] || [];
    const filteredValues = currentValues.filter(v => v.id !== valueId);
    setMultipleValues({
      ...multipleValues,
      [habitId]: filteredValues
    });
  };

  // 更新输入框的值
  const updateInputValue = (habitId: string, valueId: string, newValue: number) => {
    const currentValues = multipleValues[habitId] || [];
    const updatedValues = currentValues.map(v => 
      v.id === valueId ? { ...v, value: newValue } : v
    );
    setMultipleValues({
      ...multipleValues,
      [habitId]: updatedValues
    });
  };

  const renderHabitInput = (habit: Habit) => {
    const value = recordValues[habit.id];

    switch (habit.type) {
      case 'numeric':
      case 'duration':
        const values = multipleValues[habit.id] || [];
        const totalValue = values.reduce((sum, v) => sum + (typeof v.value === 'number' ? v.value : 0), 0);
        
        return (
          <div className="w-full space-y-2">
            {/* 显示累计值 */}
            {values.length > 0 && (
              <div className="text-sm text-gray-600 text-right">
                累计: {totalValue}{habit.unit ? ` ${habit.unit}` : ''}
              </div>
            )}
            
            {/* 输入框列表 */}
            {values.map((v) => (
              <div key={v.id} className="flex items-center gap-2 sm:gap-3">
                <input
                  type="number"
                  min="0"
                  step={habit.type === 'numeric' ? "1" : "1"}
                  value={v.value || ''}
                  onChange={(e) => updateInputValue(habit.id, v.id, Number(e.target.value) || 0)}
                  placeholder={habit.type === 'numeric' ? "输入数值" : "输入时长"}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    removeInputField(habit.id, v.id);
                    setNotification({
                      show: true,
                      message: '已删除一条记录'
                    });
                    setTimeout(() => {
                      setNotification({show: false, message: ''});
                    }, 2000);
                  }}
                  className="flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 group touch-manipulation"
                  title="删除这条记录"
                >
                  <Minus className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                </button>
              </div>
            ))}
            
            {/* 添加新输入框按钮 */}
            <button
              type="button"
              onClick={() => addInputField(habit.id)}
              className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加记录
            </button>
          </div>
        );

      case 'time-based':
        return (
          <input
            type="time"
            value={value || ''}
            onChange={(e) => setRecordValues({ ...recordValues, [habit.id]: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'check-in':
        return (
          <label className="flex items-center cursor-pointer justify-end">
            <span className="mr-2 text-sm text-gray-700">已完成</span>
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => setRecordValues({ ...recordValues, [habit.id]: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
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
    <div className="max-w-2xl mx-auto p-6 relative">
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

      {/* 成功提示消息 */}
      {notification.show && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:w-96 flex items-center p-4 mb-4 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-md transition-all duration-300 z-50">
          <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
          <span className="text-green-800">{notification.message}</span>
        </div>
      )}
      
      {/* Today's Record Card */}
      {activeHabits.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">今日记录</h2>
            <p className="text-sm text-gray-600">{formatDisplayDate(selectedDate)} 的习惯打卡</p>
          </div>

          <div className="space-y-4 mb-6">
            {activeHabits.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{habit.name}</h3>
                  <p className="text-sm text-gray-500">{getHabitSummary(habit)}</p>
                </div>
                <div className="ml-4 flex-shrink-0 w-48">
                  {renderHabitInput(habit)}
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4 border-t border-gray-100">
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