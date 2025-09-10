import React, { useState, useMemo } from 'react';
import { BarChart3, Calendar, TrendingUp, Target, Activity } from 'lucide-react';
import { Habit, HabitRecord } from '../../types';
import { HabitChart } from '../charts/HabitChart';
import { getTimeRangeDates, formatDisplayDate } from '../../utils/dateUtils';

interface DashboardProps {
  habits: Habit[];
  records: HabitRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ habits, records }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const activeHabits = habits.filter(habit => habit.isActive);
  const dateRange = getTimeRangeDates(timeRange);

  // Filter records for the selected time range
  const filteredRecords = records.filter(
    record => record.date >= dateRange.start && record.date <= dateRange.end
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHabits = activeHabits.length;
    const recordsInRange = filteredRecords.length;
    
    // Calculate completion rate for check-in habits
    const checkInHabits = activeHabits.filter(habit => habit.type === 'check-in');
    const checkInRecords = filteredRecords.filter(record => 
      checkInHabits.find(habit => habit.id === record.habitId)
    );
    const completedCheckIns = checkInRecords.filter(record => record.value === true).length;
    const completionRate = checkInRecords.length > 0 ? (completedCheckIns / checkInRecords.length) * 100 : 0;

    // Calculate streak for most recent habit
    const todayRecords = records.filter(record => 
      record.date === new Date().toISOString().split('T')[0]
    );
    const todayCompletedHabits = todayRecords.length;

    return {
      totalHabits,
      recordsInRange,
      completionRate,
      todayCompletedHabits
    };
  }, [activeHabits, filteredRecords, records]);

  const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = 
    ({ icon, label, value, color }) => (
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-full ${color}`}>
            {icon}
          </div>
          <span className="text-2xl font-bold text-gray-900">{value}</span>
        </div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">仪表板</h1>
        <p className="text-gray-600">追踪您的进度并分析您的习惯模式。</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Target className="w-6 h-6 text-blue-600" />}
          label="活跃习惯"
          value={stats.totalHabits.toString()}
          color="bg-blue-100"
        />
        <StatCard
          icon={<Activity className="w-6 h-6 text-green-600" />}
          label="今日记录"
          value={stats.todayCompletedHabits.toString()}
          color="bg-green-100"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          label="完成率"
          value={`${stats.completionRate.toFixed(0)}%`}
          color="bg-purple-100"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6 text-orange-600" />}
          label="本期记录"
          value={stats.recordsInRange.toString()}
          color="bg-orange-100"
        />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
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
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    timeRange === range
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range === 'week' ? '本周' : range === 'month' ? '本月' : '本年'}
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
        <div className="space-y-8">
          {activeHabits.map((habit) => (
            <div key={habit.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{habit.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
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
          <p className="text-gray-600">创建一些习惯来开始查看您的进度分析。</p>
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