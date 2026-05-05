import type { BackendAnswer, BackendIntent, BackendRiskLabel, ChatResponse } from '../types';

const mockIntent: BackendIntent = {
  origin: null,
  destination: 'UMass Boston',
  deadline: null,
  depart_time: null,
  high_stakes: false,
  user_constraints: [],
  raw_query: '',
};

const makeAnswer = (text: string, label: BackendRiskLabel = 'reliable', suggestedDepart: string | null = null): BackendAnswer => ({
  recommendation: text,
  risk: {
    label,
    buffer_min: 0,
    sigma_used: 1.0,
    explanation: 'mock',
    triggered_alerts: [],
  },
  plan: null,
  suggested_depart_time: suggestedDepart,
  citations: [],
  raw_response: text,
  generated_at: new Date().toISOString(),
});

export const MOCK_CHAT_RESPONSES = {
  redLine: {
    answer: makeAnswer(
      'The Red Line is usable, but give yourself a wider buffer around JFK/UMass.',
      'caution',
    ),
    intent: { ...mockIntent, raw_query: 'red line status' },
    retrieved: [],
  },
  trip: {
    answer: makeAnswer(
      'Leave by 9:02 AM to keep a 12-minute buffer for your 10:00 AM class.',
      'reliable',
      '09:02',
    ),
    intent: { ...mockIntent, deadline: '10:00', raw_query: 'when should I leave' },
    retrieved: [],
  },
  schedule: {
    answer: makeAnswer(
      'Based on your schedule, I can help with timing. What class are you asking about?',
      'reliable',
    ),
    intent: { ...mockIntent, raw_query: 'class schedule' },
    retrieved: [],
  },
  fallback: {
    answer: makeAnswer(
      'I can help with commute timing, Red Line risk, and class schedule planning.',
      'reliable',
    ),
    intent: mockIntent,
    retrieved: [],
  },
} satisfies Record<string, ChatResponse>;

export const getMockChatReply = (message: string): ChatResponse => {
  const q = message.toLowerCase();
  if (q.includes('red') || q.includes('delay') || q.includes('alert')) return MOCK_CHAT_RESPONSES.redLine;
  if (q.includes('leave') || q.includes('on time') || q.includes('make it')) return MOCK_CHAT_RESPONSES.trip;
  if (q.includes('class') || q.includes('schedule') || q.includes('algorithm')) return MOCK_CHAT_RESPONSES.schedule;
  return MOCK_CHAT_RESPONSES.fallback;
};
