import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Habit, HabitRecord } from '../../types';
import { getDaysInRange, formatDisplayDate } from '../../utils/dateUtils';
import { storage } from '../../utils/storage';

interface HabitChartProps {
  habit: Habit;
  records: HabitRecord[];
  timeRange: { start: string; end: string };
  chartType: 'bar' | 'line';
}

export const HabitChart: React.FC<HabitChartProps> = ({ habit, records, timeRange, chartType }) => {
  const days = getDaysInRange(timeRange.start, timeRange.end);
  
  // 响应式窗口大小检测
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  const chartData = days.map(day => {
    // 使用storage.getRecordValue获取累计值
    const recordValue = storage.getRecordValue(habit.id, day, habit.type);
    const record = records.find(r => r.habitId === habit.id && r.date === day);
    let value = 0;
    let originalValue = null;
    
    if (record) {
      if (habit.type === 'check-in') {
        value = recordValue ? 1 : 0;
      } else if (habit.type === 'time-based') {
        // For time-based habits, we'll calculate the difference from target
        if (typeof recordValue === 'string' && habit.target && typeof habit.target === 'string') {
          // Store original time value for tooltip display
          originalValue = recordValue;
          
          // Convert both record time and target time to minutes
          const [recordHours, recordMinutes] = recordValue.split(':');
          const recordTimeInMinutes = parseInt(recordHours) * 60 + parseInt(recordMinutes);
          
          const [targetHours, targetMinutes] = habit.target.split(':');
          const targetTimeInMinutes = parseInt(targetHours) * 60 + parseInt(targetMinutes);
          
          // Calculate the difference in minutes, inverted for chart display
          // Early becomes positive (plotted up), Late becomes negative (plotted down)
          if (recordTimeInMinutes < targetTimeInMinutes - 720) { // 12 hours threshold
            // Past midnight case (late)
            value = targetTimeInMinutes - (recordTimeInMinutes + 1440);
          } else if (recordTimeInMinutes > targetTimeInMinutes + 720) { // 12 hours threshold
            // Early morning case (e.g. target is 01:00 but recorded 23:00 previous day, early)
            value = (targetTimeInMinutes + 1440) - recordTimeInMinutes;
          } else {
            // Normal case
            value = targetTimeInMinutes - recordTimeInMinutes;
          }
        }
      } else {
        // 对于数值型和时长型，使用累计值
        value = Number(recordValue) || 0;
      }
    }
    
    return {
      date: day,
      value,
      originalValue,
      displayDate: formatDisplayDate(day).split(',')[0], // Short date
      hasRecord: !!record,
      note: record?.note
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{formatDisplayDate(data.date)}</p>
          <p className="text-blue-600">
            {habit.type === 'check-in' ? (
              data.value ? '已完成' : '未完成'
            ) : habit.type === 'time-based' ? (
              <>
                {data.originalValue && (
                  <span>记录时间: {data.originalValue}</span>
                )}
                {habit.target && (
                  <span className="block">目标时间: {habit.target}</span>
                )}
                <span className="block mt-1">
                  {data.value === 0 
                    ? '准时' 
                    : data.value > 0 
                      ? `早了 ${Math.floor(Math.abs(data.value) / 60)}小时${Math.abs(data.value) % 60}分钟` 
                      : `晚了 ${Math.floor(Math.abs(data.value) / 60)}小时${Math.abs(data.value) % 60}分钟`
                  }
                </span>
              </>
            ) : (
              `${data.value}${habit.unit ? ` ${habit.unit}` : ''}`
            )}
          </p>
          {data.note && <p className="text-sm text-gray-600 mt-1">备注：{data.note}</p>}
        </div>
      );
    }
    return null;
  };

  const yAxisTickFormatter = (value: number) => {
    if (value === 0) return '目标';
    const hours = Math.floor(Math.abs(value) / 60);
    const minutes = Math.abs(value) % 60;
    const prefix = value > 0 ? '早' : '晚';
    
    let timeString = '';
    if (hours > 0) {
      timeString += `${hours}小时`;
    }
    if (minutes > 0) {
      timeString += `${minutes}分钟`;
    }
    
    return `${prefix} ${timeString}`;
  };

  // 计算数据中的最大最小值
  const maxValue = Math.max(...chartData.map(item => item.value || 0), 60); // 至少包含1小时
  const minValue = Math.min(...chartData.map(item => item.value || 0), -60); // 至少包含-1小时

  // 向上取整到最接近的小时
  const maxHour = Math.ceil(maxValue / 60) * 60;
  const minHour = Math.floor(minValue / 60) * 60;

  // 生成合适的刻度点
  const yAxisTicks: number[] = [];
  for (let i = minHour; i <= maxHour; i += 30) { // 每30分钟一个刻度
    yAxisTicks.push(i);
  }

  // For check-in habits, use a linear calendar bar visualization
  if (habit.type === 'check-in') {
    const today = new Date().toISOString().split('T')[0];
    const totalDays = chartData.length;
    
    // Calculate consecutive check-in days
    let consecutiveDays = 0;
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].value && chartData[i].date <= today) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    
    // Determine display style based on time range
    const getDisplayStyle = () => {
      if (totalDays <= 7) {
        // 近7天/本周：大图标，显示完整日期和星期
        return 'large';
      } else if (totalDays <= 31) {
        // 近30天/本月：中等图标，显示日期数字
        return 'medium';
      } else {
        // 本年：小图标
        return 'small';
      }
    };
    
    const displayStyle = getDisplayStyle();
    
    const formatDateDisplay = (dateStr: string) => {
      const date = new Date(dateStr);
      const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
      
      if (displayStyle === 'large') {
        return {
          main: `${date.getMonth() + 1}/${date.getDate()}`,
          sub: `周${dayOfWeek}`
        };
      } else if (displayStyle === 'medium') {
        return {
          main: `${date.getDate()}`,
          sub: `${dayOfWeek}`
        };
      } else {
        return {
          main: `${date.getDate()}`,
          sub: ''
        };
      }
    };
    
    return (
      <div className="space-y-4">
        {/* Linear Calendar Bar */}
        <div className="flex flex-wrap gap-2 justify-center">
          {chartData.map((day) => {
            const isToday = day.date === today;
            const dateDisplay = formatDateDisplay(day.date);
            
            return (
              <div
                key={day.date}
                className="flex flex-col items-center"
                title={`${formatDisplayDate(day.date)}：${day.value ? '已完成' : '未完成'}${day.note ? `\n备注：${day.note}` : ''}`}
              >
                {/* Date Circle */}
                <div
                  className={`relative flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 ${
                    displayStyle === 'large' 
                      ? 'w-12 h-12' 
                      : displayStyle === 'medium' 
                      ? 'w-10 h-10' 
                      : 'w-8 h-8'
                  } ${
                    day.value
                      ? 'bg-green-500 text-white border-2 border-green-600'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                  } ${
                    isToday ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                  }`}
                >
                  {day.value ? (
                    <svg className={`${displayStyle === 'small' ? 'w-3 h-3' : 'w-4 h-4'} text-white`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : null}
                </div>
                
                {/* Date Label */}
                {displayStyle !== 'small' && (
                  <div className={`text-center mt-1 ${displayStyle === 'large' ? 'text-xs' : 'text-xs'}`}>
                    <div className="font-medium text-gray-700">{dateDisplay.main}</div>
                    {dateDisplay.sub && (
                      <div className="text-gray-500 text-xs">{dateDisplay.sub}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Statistics and Legend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>已完成</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-100 border-2 border-gray-200 rounded-full"></div>
              <span>未完成</span>
            </div>
          </div>
          
          {consecutiveDays > 0 && (
            <div className="text-sm text-green-600 font-medium">
              连续打卡 {consecutiveDays} 天
            </div>
          )}
        </div>
      </div>
    );
  }

  // For time-based habits, the target value is 0 (no deviation from target time)
  // For other types, use the actual target value
  const targetValue = habit.type === 'time-based' ? 0 : (habit.target ? Number(habit.target) : null);

  // 响应式边距设置
  const getChartMargin = () => {
    return {
      top: isMobile ? 10 : 20,
      right: isMobile ? 10 : 30,
      left: isMobile ? 5 : 20,
      bottom: isMobile ? 35 : 60
    };
  };

  return (
    <div style={{ width: '100%', height: 'clamp(250px, 40vh, 400px)' }} className="min-h-[250px] sm:min-h-[300px]">
      <ResponsiveContainer>
        {chartType === 'bar' ? (
          <BarChart data={chartData} margin={getChartMargin()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickFormatter={habit.type === 'time-based' ? yAxisTickFormatter : undefined}
              ticks={habit.type === 'time-based' ? yAxisTicks : undefined}
              domain={habit.type === 'time-based' ? [minHour, maxHour] : undefined}
              width={isMobile ? 40 : 60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell 
                  key={`cell-${entry.date}`} 
                  fill={
                    !entry.hasRecord 
                      ? '#E5E7EB' // No record
                      : habit.type === 'time-based'
                        ? entry.value > 0 
                          ? '#22C55E' // Green for early
                          : entry.value < 0
                            ? '#EF4444' // Red for late
                            : '#3B82F6'   // Blue for on-time
                        : '#3B82F6'   // Default blue
                  }
                />
              ))}
            </Bar>
            {targetValue !== null && (
              <ReferenceLine y={targetValue} stroke="#1F2937" strokeWidth={1} strokeDasharray="3 3" />
            )}
          </BarChart>
        ) : (
          <LineChart data={chartData} margin={getChartMargin()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickFormatter={habit.type === 'time-based' ? yAxisTickFormatter : undefined}
              ticks={habit.type === 'time-based' ? yAxisTicks : undefined}
              domain={habit.type === 'time-based' ? [minHour, maxHour] : undefined}
              width={isMobile ? 40 : 60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!payload?.hasRecord) return <circle cx={cx} cy={cy} r={0} fill="transparent" />;

                let fillColor = '#3B82F6'; // Default on-time or other types
                if (habit.type === 'time-based') {
                  if (payload.value > 0) {
                    fillColor = '#22C55E'; // Green for early
                  } else if (payload.value < 0) {
                    fillColor = '#EF4444'; // Red for late
                  }
                }
                
                return <circle cx={cx} cy={cy} r={4} stroke={fillColor} strokeWidth={2} fill="#fff" />;
              }}
              activeDot={{ r: 6 }}
            />
            {targetValue !== null && (
              <ReferenceLine y={targetValue} stroke="#1F2937" strokeWidth={1} strokeDasharray="3 3" />
            )}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};