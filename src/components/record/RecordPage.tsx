import React, { useState } from 'react';
import { Calendar, Save, ChevronLeft, ChevronRight, CheckCircle, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
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
  // 为时间段型习惯存储起止时间和扣除时间
  const [timeSpanValues, setTimeSpanValues] = useState<Record<string, {startTime: string, endTime: string, deduction: number}>>({});
  const [notification, setNotification] = useState<{show: boolean; message: string}>({show: false, message: ''});
  const [showCompleted, setShowCompleted] = useState(true);
  const [showNotCompleted, setShowNotCompleted] = useState(true);

  const activeHabits = habits.filter(habit => habit.isActive).sort((a, b) => a.order - b.order);

  // 使用 useMemo 计算已完成和未完成的习惯
  const { completedHabits, notCompletedHabits } = React.useMemo(() => {
    const completed: Habit[] = [];
    const notCompleted: Habit[] = [];

    activeHabits.forEach(habit => {
      switch (habit.type) {
        case 'check-in':
          if (recordValues[habit.id] === true) {
            completed.push(habit);
          } else {
            notCompleted.push(habit);
          }
          break;
        case 'time-based':
          if (recordValues[habit.id] && recordValues[habit.id] !== '') {
            completed.push(habit);
          } else {
            notCompleted.push(habit);
          }
          break;
        case 'numeric':
        case 'duration':
          const values = multipleValues[habit.id] || [];
          const totalValue = values.reduce((sum, v) => sum + (typeof v.value === 'number' ? v.value : 0), 0);
          
          if (habit.target) {
            // 如果设置了目标，需要达到目标值才算完成
            if (totalValue >= Number(habit.target)) {
              completed.push(habit);
            } else {
              notCompleted.push(habit);
            }
          } else {
            // 如果没有设置目标，只要有记录就算完成
            if (totalValue > 0) {
              completed.push(habit);
            } else {
              notCompleted.push(habit);
            }
          }
          break;
        case 'time-span':
          const timeSpanValue = timeSpanValues[habit.id];
          if (timeSpanValue && timeSpanValue.startTime && timeSpanValue.endTime) {
            completed.push(habit);
          } else {
            notCompleted.push(habit);
          }
          break;
        default:
          notCompleted.push(habit);
      }
    });

    return { completedHabits: completed, notCompletedHabits: notCompleted };
  }, [activeHabits, recordValues, multipleValues, timeSpanValues, selectedDate]);

  // Load existing records for the selected date
  React.useEffect(() => {
    const existingRecords = records.filter(record => record.date === selectedDate);
    const values: Record<string, any> = {};
    const multiples: Record<string, Array<{id: string, value: number | string}>> = {};
    const timeSpans: Record<string, {startTime: string, endTime: string, deduction: number}> = {};

    existingRecords.forEach(record => {
      if (record.values && Array.isArray(record.values)) {
        // 新格式：多值记录
        const habit = habits.find(h => h.id === record.habitId);
        if (habit && (habit.type === 'numeric' || habit.type === 'duration')) {
          multiples[record.habitId] = record.values.map(v => ({
            id: v.id,
            value: v.value as number
          }));
        } else if (habit && habit.type === 'time-span') {
          // 时间段类型的记录
          const firstValue = record.values[0];
          if (firstValue && typeof firstValue.value === 'object') {
            const timeSpanData = firstValue.value as any;
            timeSpans[record.habitId] = {
              startTime: timeSpanData.startTime || '',
              endTime: timeSpanData.endTime || '',
              deduction: timeSpanData.deduction || 0.5
            };
          }
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
    setTimeSpanValues(timeSpans);
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
      } else if (habit.type === 'time-span') {
        // 处理时间段记录
        const timeSpanValue = timeSpanValues[habit.id];
        if (timeSpanValue && timeSpanValue.startTime && timeSpanValue.endTime) {
          recordsToSave.push({
            habitId: habit.id,
            date: selectedDate,
            values: [{
              id: generateId(),
              value: {
                startTime: timeSpanValue.startTime,
                endTime: timeSpanValue.endTime,
                deduction: timeSpanValue.deduction
              },
              timestamp: new Date().toISOString()
            }]
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
              <div key={v.id} className="flex items-center gap-2 sm:gap-3 w-full">
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
          <div className="w-full flex justify-end">
            <input
              type="time"
              value={value || ''}
              onChange={(e) => setRecordValues({ ...recordValues, [habit.id]: e.target.value })}
              className="px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      case 'check-in':
        return (
          <div className="w-full flex justify-end">
            <label className="flex items-center cursor-pointer">
              <span className="mr-2 text-sm text-gray-700">已完成</span>
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => setRecordValues({ ...recordValues, [habit.id]: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        );

      case 'time-span':
        const timeSpanValue = timeSpanValues[habit.id] || { startTime: '', endTime: '', deduction: 0.5 };
        return (
          <div className="w-full space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">开始时间</label>
                <input
                  type="time"
                  value={timeSpanValue.startTime}
                  onChange={(e) => setTimeSpanValues({
                    ...timeSpanValues,
                    [habit.id]: { ...timeSpanValue, startTime: e.target.value }
                  })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">结束时间</label>
                <input
                  type="time"
                  value={timeSpanValue.endTime}
                  onChange={(e) => setTimeSpanValues({
                    ...timeSpanValues,
                    [habit.id]: { ...timeSpanValue, endTime: e.target.value }
                  })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">扣除时间（小时）</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={timeSpanValue.deduction}
                onChange={(e) => setTimeSpanValues({
                  ...timeSpanValues,
                  [habit.id]: { ...timeSpanValue, deduction: parseFloat(e.target.value) || 0 }
                })}
                placeholder="0.5"
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
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
    <div className="max-w-2xl mx-auto p-3 sm:p-6 relative">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">记录习惯</h1>
        <p className="text-gray-600">追踪您的每日进度，培养持久的习惯。</p>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
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

      {/* 完成状态概览 */}
      <div className="space-y-4 mb-6 sm:mb-8">
        {/* 已完成列表 */}
        <div className="bg-white rounded-xl border border-gray-200">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900">已完成 ({completedHabits.length})</h3>
            </div>
            {showCompleted ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {showCompleted && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
              {completedHabits.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {completedHabits.map((habit) => {
                    let displayText = habit.name;
                    
                    switch (habit.type) {
                      case 'numeric':
                      case 'duration':
                        const values = multipleValues[habit.id] || [];
                        const totalValue = values.reduce((sum, v) => sum + (typeof v.value === 'number' ? v.value : 0), 0);
                        if (habit.target) {
                          displayText += ` - ${totalValue}/${habit.target}${habit.unit ? ` ${habit.unit}` : ''}`;
                        } else {
                          displayText += ` - ${totalValue}${habit.unit ? ` ${habit.unit}` : ''}`;
                        }
                        break;
                      case 'time-based':
                        const timeValue = recordValues[habit.id];
                        if (timeValue) {
                          displayText += ` - ${timeValue}`;
                        }
                        break;
                      case 'time-span':
                        const timeSpanValue = timeSpanValues[habit.id];
                        if (timeSpanValue && timeSpanValue.startTime && timeSpanValue.endTime) {
                          displayText += ` - ${timeSpanValue.startTime} 至 ${timeSpanValue.endTime}`;
                        }
                        break;
                      case 'check-in':
                      default:
                        // 签到型只显示名称
                        break;
                    }
                    
                    return (
                      <div key={habit.id} className="flex items-center gap-3 py-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{displayText}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 text-center text-sm text-gray-500 py-4">
                  暂无已完成的习惯
                </div>
              )}
            </div>
          )}
        </div>

        {/* 未完成列表 */}
        <div className="bg-white rounded-xl border border-gray-200">
          <button
            onClick={() => setShowNotCompleted(!showNotCompleted)}
            className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <h3 className="font-semibold text-gray-900">未完成 ({notCompletedHabits.length})</h3>
            </div>
            {showNotCompleted ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {showNotCompleted && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
              {notCompletedHabits.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {notCompletedHabits.map((habit) => {
                    let displayText = habit.name;
                    
                    switch (habit.type) {
                      case 'numeric':
                      case 'duration':
                        const values = multipleValues[habit.id] || [];
                        const totalValue = values.reduce((sum, v) => sum + (typeof v.value === 'number' ? v.value : 0), 0);
                        if (habit.target) {
                          displayText += ` - ${totalValue}/${habit.target}${habit.unit ? ` ${habit.unit}` : ''}`;
                        } else {
                          displayText += ` - ${totalValue}${habit.unit ? ` ${habit.unit}` : ''}`;
                        }
                        break;
                      case 'time-based':
                        const timeValue = recordValues[habit.id];
                        if (timeValue) {
                          displayText += ` - ${timeValue}`;
                        }
                        break;
                      case 'time-span':
                        const timeSpanValue = timeSpanValues[habit.id];
                        if (timeSpanValue && timeSpanValue.startTime && timeSpanValue.endTime) {
                          displayText += ` - ${timeSpanValue.startTime} 至 ${timeSpanValue.endTime}`;
                        }
                        break;
                      case 'check-in':
                      default:
                        // 签到型只显示名称
                        break;
                    }
                    
                    return (
                      <div key={habit.id} className="flex items-center gap-3 py-2 text-sm text-gray-700">
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex-shrink-0"></div>
                        <span>{displayText}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 text-center text-sm text-gray-500 py-4">
                  所有习惯都已完成！
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Today's Record Card */}
      {activeHabits.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">今日记录</h2>
            <p className="text-sm text-gray-600">{formatDisplayDate(selectedDate)} 的习惯打卡</p>
          </div>

          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {activeHabits.map((habit) => (
              <div key={habit.id} className="flex flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0 gap-3">
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