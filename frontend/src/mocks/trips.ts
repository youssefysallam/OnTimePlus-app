import type { TripEstimate } from '../types';
import { MOCK_ALERTS } from './alerts';

export const MOCK_TRIP_WITH_DELAY: TripEstimate = {
  id: 'trip-delay',
  leaveBy: '09:02',
  arriveBy: '09:48',
  bufferMin: 12,
  risk: 'MEDIUM',
  affectingAlerts: [MOCK_ALERTS[0]],
  legs: [
    {
      id: 'leg-red',
      mode: 'SUBWAY',
      line: 'RED',
      from: 'Park Street',
      to: 'JFK/UMass',
      departAt: '09:10',
      arriveAt: '09:34',
      durationMin: 24,
    },
    {
      id: 'leg-shuttle',
      mode: 'SHUTTLE',
      from: 'JFK/UMass',
      to: 'Campus Center',
      departAt: '09:38',
      arriveAt: '09:48',
      durationMin: 10,
    },
  ],
};

export const MOCK_TRIPS: TripEstimate[] = [MOCK_TRIP_WITH_DELAY];
