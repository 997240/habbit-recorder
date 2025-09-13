import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { HabitChart } from '../charts/HabitChart';
import { getTimeRangeDates, formatDisplayDate } from '../../utils/dateUtils';
import { useHabitStore } from '../../stores/habitStore';
import { useUIStore } from '../../stores/uiStore';

export const Dashboard: React.FC = () => {
  // 使用 selector 精确订阅需要的状态
  const habits = useHabitStore(state => state.habits);
  const records = useHabitStore(state => state.records);
  const navigateTo = useUIStore(state => state.navigateTo);
  const [timeRange, setTimeRange] = useState<'last7days' | 'week' | 'last30days' | 'month' | 'year'>('week');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const activeHabits = habits.filter(habit => habit.isActive);
  const dateRange = getTimeRangeDates(timeRange);

  // Filter records for the selected time range
  const filteredRecords = records.filter(
    record => record.date >= dateRange.start && record.date <= dateRange.end
  );


  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">仪表板</h1>
        <p className="text-gray-600">追踪您的进度并分析您的习惯模式。</p>
      </div>


      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">查看时期</h3>
            <p className="text-sm text-gray-600">
              {formatDisplayDate(dateRange.start)} - {formatDisplayDate(dateRange.end)}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Time Range Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['last7days', 'week', 'last30days', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    timeRange === range
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range === 'last7days' 
                    ? '近7天' 
                    : range === 'week' 
                    ? '本周' 
                    : range === 'last30days'
                    ? '近30天'
                    : range === 'month' 
                    ? '本月' 
                    : '本年'}
                </button>
              ))}
            </div>

            {/* Chart Type Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['bar', 'line'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    chartType === type
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type === 'bar' ? '柱状图' : '折线图'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {activeHabits.length > 0 ? (
        <div className="space-y-4 sm:space-y-8">
          {activeHabits.map((habit) => (
            <div key={habit.id} className="bg-white rounded-xl border border-gray-200 p-2 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{habit.name}</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
                  <span>类型：{getHabitTypeLabel(habit.type)}</span>
                  {habit.unit && <span>单位：{habit.unit}</span>}
                  {habit.target && <span>目标：{habit.target}{habit.unit ? ` ${habit.unit}` : ''}</span>}
                </div>
              </div>
              
              <HabitChart
                habit={habit}
                records={filteredRecords}
                timeRange={dateRange}
                chartType={chartType}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无习惯可显示</h3>
          <p className="text-gray-600 mb-6">开始您的习惯养成之旅！</p>
          <button
            onClick={() => navigateTo('habits')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            创建我的第一个习惯
          </button>
        </div>
      )}
    </div>
  );

  function getHabitTypeLabel(type: string) {
    switch (type) {
      case 'numeric': return '数值型';
      case 'duration': return '计时型';
      case 'time-based': return '时间点型';
      case 'check-in': return '签到型';
      default: return type;
    }
  }
};