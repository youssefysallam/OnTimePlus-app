import { formatClock, minutesUntil, todayDayOfWeek } from '../../src/utils/time';

describe('time utils', () => {
  it('formats clock time', () => {
    expect(formatClock('09:05')).toBe('9:05 AM');
    expect(formatClock('14:30')).toBe('2:30 PM');
  });

  it('computes minutes until a clock time', () => {
    expect(minutesUntil('09:30', new Date('2026-04-24T09:00:00'))).toBe(30);
  });

  it('gets the day of week', () => {
    expect(todayDayOfWeek(new Date('2026-04-24T12:00:00'))).toBe('FRI');
  });
});
