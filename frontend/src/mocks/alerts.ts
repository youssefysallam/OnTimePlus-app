import type { Alert } from '../types';

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-red-signal',
    line: 'RED',
    severity: 'MODERATE',
    title: 'Signal issue near JFK/UMass',
    description: 'Southbound Red Line trips are running about 8 minutes behind schedule.',
    affectedSegment: 'JFK/UMass to Andrew',
    reportedAt: Date.now() - 1000 * 60 * 20,
    source: 'MOCK',
  },
  {
    id: 'alert-shuttle-campus',
    mode: 'SHUTTLE',
    severity: 'ON_TIME',
    title: 'Campus shuttle operating normally',
    description: 'UMB shuttle service is running its regular weekday loop.',
    affectedSegment: 'JFK/UMass to Campus Center',
    reportedAt: Date.now() - 1000 * 60 * 12,
    source: 'MOCK',
  },
];
