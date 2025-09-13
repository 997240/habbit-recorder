import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, parseISO, subDays } from 'date-fns';

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const formatDisplayDate = (dateString: string): string => {
  return format(parseISO(dateString), 'MMM dd, yyyy');
};

export const getTimeRangeDates = (range: 'last7days' | 'week' | 'last30days' | 'month' | 'year', baseDate: Date = new Date()) => {
  switch (range) {
    case 'last7days':
      return {
        start: formatDate(subDays(baseDate, 6)), // 今天 - 6天 = 近7天
        end: formatDate(baseDate)
      };
    case 'week':
      return {
        start: formatDate(startOfWeek(baseDate, { weekStartsOn: 1 })),
        end: formatDate(endOfWeek(baseDate, { weekStartsOn: 1 }))
      };
    case 'last30days':
      return {
        start: formatDate(subDays(baseDate, 29)), // 今天 - 29天 = 近30天
        end: formatDate(baseDate)
      };
    case 'month':
      return {
        start: formatDate(startOfMonth(baseDate)),
        end: formatDate(endOfMonth(baseDate))
      };
    case 'year':
      return {
        start: formatDate(startOfYear(baseDate)),
        end: formatDate(endOfYear(baseDate))
      };
    default:
      return {
        start: formatDate(new Date()),
        end: formatDate(new Date())
      };
  }
};

export const getDaysInRange = (start: string, end: string): string[] => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return eachDayOfInterval({ start: startDate, end: endDate }).map(date => formatDate(date));
};

export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// 计算时间段的净时长（小时）
export const calculateDuration = (startTime: string, endTime: string, deduction: number = 0): number => {
  if (!startTime || !endTime) return 0;
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  // 处理跨天的情况
  const totalMinutes = endMinutes >= startMinutes 
    ? endMinutes - startMinutes 
    : (24 * 60) + endMinutes - startMinutes;
  
  const totalHours = totalMinutes / 60;
  const netHours = Math.max(0, totalHours - deduction);
  
  return Math.round(netHours * 100) / 100; // 保留两位小数
};

// 获取自定义月度周期的起止日期
export const getCustomMonthRange = (monthlyStartDay: number, baseDate: Date = new Date()) => {
  const currentDate = new Date(baseDate);
  const currentDay = currentDate.getDate();
  
  let startDate: Date;
  let endDate: Date;
  
  if (currentDay >= monthlyStartDay) {
    // 当前日期在起始日之后，使用当前月的起始日到下个月的起始日前一天
    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), monthlyStartDay);
    endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, monthlyStartDay - 1);
  } else {
    // 当前日期在起始日之前，使用上个月的起始日到当前月的起始日前一天
    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, monthlyStartDay);
    endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), monthlyStartDay - 1);
  }
  
  return {
    start: formatDate(startDate),
    end: formatDate(endDate)
  };
};