import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
    
    if (record) {
      if (habit.type === 'check-in') {
        value = record.value ? 1 : 0;
      } else if (habit.type === 'time-based') {
        // Convert time to minutes for visualization
        if (typeof record.value === 'string') {
          const [hours, minutes] = record.value.split(':');
          value = parseInt(hours) * 60 + parseInt(minutes);
        }
      } else {
        value = Number(record.value) || 0;
      }
    }
    
    return {
      date: day,
      value,
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
            {habit.type === 'check-in' 
              ? (data.value ? '已完成' : '未完成')
              : habit.type === 'time-based'
              ? `${Math.floor(data.value / 60)}:${(data.value % 60).toString().padStart(2, '0')}`
              : `${data.value}${habit.unit ? ` ${habit.unit}` : ''}`
            }
          </p>
          {data.note && <p className="text-sm text-gray-600 mt-1">备注：{data.note}</p>}
        </div>
      );
    }
    return null;
  };

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

  const targetValue = habit.target ? Number(habit.target) : null;

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
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.hasRecord ? '#3B82F6' : '#E5E7EB'} 
                />
              ))}
            </Bar>
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
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
            />
            {targetValue && (
              <Line 
                type="monotone" 
                dataKey={() => targetValue}
                stroke="#EF4444" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};