import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ClassEvent, Conversation } from '../types';

const KEYS = {
  schedule: 'ontimeplus:schedule',
  sessionId: 'ontimeplus:sessionId',
  onboarded: 'ontimeplus:onboarded',
  history: 'ontimeplus:history',
} as const;

const parseJson = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const storage = {
  async getSchedule(): Promise<ClassEvent[]> {
    return parseJson(await AsyncStorage.getItem(KEYS.schedule), []);
  },
  async setSchedule(classes: ClassEvent[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.schedule, JSON.stringify(classes));
  },
  async getSessionId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.sessionId);
  },
  async setSessionId(id: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.sessionId, id);
  },
  async getOnboarded(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.onboarded)) === 'true';
  },
  async setOnboarded(value: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.onboarded, String(value));
  },
  async getHistory(): Promise<Conversation[]> {
    return parseJson(await AsyncStorage.getItem(KEYS.history), []);
  },
  async appendHistory(conversation: Conversation): Promise<void> {
    const history = await this.getHistory();
    await AsyncStorage.setItem(KEYS.history, JSON.stringify([conversation, ...history].slice(0, 50)));
  },
};
