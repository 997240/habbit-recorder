import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Habit, HabitRecord } from '../../types';
import { getDaysInRange, formatDisplayDate } from '../../utils/dateUtils';

interface HabitChartProps {
  habit: Habit;
  records: HabitRecord[];
  timeRange: { start: string; end: string };
  chartType: 'bar' | 'line';
}

export const HabitChart: React.FC<HabitChartProps> = ({ habit, records, timeRange, chartType }) => {
  const days = getDaysInRange(timeRange.start, timeRange.end);
  
  const chartData = days.map(day => {
    const record = records.find(r => r.habitId === habit.id && r.date === day);
    let value = 0;
    let originalValue = null;
    
    if (record) {
      if (habit.type === 'check-in') {
        value = record.value ? 1 : 0;
      } else if (habit.type === 'time-based') {
        // For time-based habits, we'll calculate the difference from target
        if (typeof record.value === 'string' && habit.target && typeof habit.target === 'string') {
          // Store original time value for tooltip display
          originalValue = record.value;
          
          // Convert both record time and target time to minutes
          const [recordHours, recordMinutes] = record.value.split(':');
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
        value = Number(record.value) || 0;
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

  const CustomTooltip = ({ active, payload, label }: any) => {
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
                      ? `晚了 ${Math.floor(Math.abs(data.value) / 60)}小时${Math.abs(data.value) % 60}分钟` 
                      : `早了 ${Math.floor(Math.abs(data.value) / 60)}小时${Math.abs(data.value) % 60}分钟`
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

  const yAxisTicks = [-120, -90, -60, -30, 0, 30, 60, 90, 120];

  // For check-in habits, use a heatmap-style visualization
  if (habit.type === 'check-in') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {chartData.map((day, index) => (
            <div
              key={day.date}
              className={`w-8 h-8 rounded-sm border ${
                day.value 
                  ? 'bg-green-500 border-green-600' 
                  : day.hasRecord 
                  ? 'bg-gray-200 border-gray-300' 
                  : 'bg-gray-100 border-gray-200'
              }`}
              title={`${day.displayDate}：${day.value ? '已完成' : '未完成'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
            <span>未完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <span>无数据</span>
          </div>
        </div>
      </div>
    );
  }

  // For time-based habits, the target value is 0 (no deviation from target time)
  // For other types, use the actual target value
  const targetValue = habit.type === 'time-based' ? 0 : (habit.target ? Number(habit.target) : null);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        {chartType === 'bar' ? (
          <BarChart data={chartData}>
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
              domain={habit.type === 'time-based' ? ['auto', 'auto'] : undefined}
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
          <LineChart data={chartData}>
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
              domain={habit.type === 'time-based' ? ['auto', 'auto'] : undefined}
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