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