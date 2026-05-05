import type { ClassEvent } from '../types';

export const MOCK_SCHEDULE: ClassEvent[] = [
  {
    id: 'class-ai',
    name: 'Artificial Intelligence',
    days: ['MON', 'WED', 'FRI'],
    startTime: '10:00',
    endTime: '11:15',
    location: 'Wheatley Hall',
  },
  {
    id: 'class-systems',
    name: 'Computer Systems',
    days: ['TUE', 'THU'],
    startTime: '14:00',
    endTime: '15:15',
    location: 'University Hall',
  },
];

export const MOCK_PARSED_SCHEDULE: ClassEvent = {
  id: 'class-parsed',
  name: 'Algorithms',
  days: ['MON', 'WED'],
  startTime: '09:30',
  endTime: '10:45',
  location: 'McCormack Hall',
};
