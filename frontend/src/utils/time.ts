import type { DayOfWeek } from '../types';

const DAYS: DayOfWeek[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const todayDayOfWeek = (date = new Date()): DayOfWeek => DAYS[date.getDay()];

export const formatClock = (hhmm: string): string => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const suffix = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

export const minutesUntil = (hhmm: string, now = new Date()): number => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 60000);
};
