import type { Alert, ApiChatRequest, ApiChatSchedule, ChatResponse, ClassEvent, Message, TripEstimate } from '../types';
import { getMockChatReply, MOCK_ALERTS, MOCK_SCHEDULE, MOCK_TRIP_WITH_DELAY } from '../mocks';
import { storage } from '../storage/asyncStore';
import { newId } from '../utils/uuid';

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS !== 'false';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:8000';

const toApiSchedule = (classes: ClassEvent[]): ApiChatSchedule | undefined => {
  const event = classes[0];
  if (!event) return undefined;
  return {
    event: event.name,
    time: event.startTime,       // raw "HH:MM" — backend parse_hhmm expects 24-hour format
    destination: event.location,
  };
};

export const api = {
  async sendMessage(message: string, schedule: ClassEvent[] = []): Promise<ChatResponse> {
    if (USE_MOCKS) return getMockChatReply(message);
    const payload: ApiChatRequest = {
      query: message,
      schedule: toApiSchedule(schedule),
    };
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Chat request failed');
    return response.json() as Promise<ChatResponse>;
  },

  /* BE NEEDED: replace or augment mock alerts with GET https://api-v3.mbta.com/alerts and map response objects to Alert[]. */
  async getAlerts(): Promise<Alert[]> {
    return MOCK_ALERTS;
  },

  async getSchedule(): Promise<ClassEvent[]> {
    const saved = await storage.getSchedule();
    return saved.length > 0 ? saved : MOCK_SCHEDULE;
  },

  async saveSchedule(classes: ClassEvent[]): Promise<void> {
    await storage.setSchedule(classes);
  },

  async getBriefingEstimate(classes: ClassEvent[], alerts: Alert[]): Promise<TripEstimate> {
    return { ...MOCK_TRIP_WITH_DELAY, affectingAlerts: alerts.slice(0, 1) };
  },

  async getBriefingMessage(classes: ClassEvent[], alerts: Alert[]): Promise<Message> {
    const estimate = await this.getBriefingEstimate(classes, alerts);
    return {
      id: newId(),
      role: 'bot',
      text: 'Morning briefing ready. Your next commute has a moderate Red Line risk, so leave a little early.',
      timestamp: Date.now(),
      cards: [{ type: 'BRIEFING', estimate, classEvent: classes[0], summary: 'Red Line buffer recommended this morning.' }],
      chips: ['When should I leave?', 'Red Line status'],
    };
  },

  /* BE NEEDED: route natural-language schedule parsing through POST /chat with a parse intent until a dedicated contract exists. */
  async parseSchedule(_text: string): Promise<ClassEvent[]> {
    return [];
  },
};
