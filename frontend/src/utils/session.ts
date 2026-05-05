import { storage } from '../storage/asyncStore';
import { newId } from './uuid';

export const getOrCreateSessionId = async (): Promise<string> => {
  const existing = await storage.getSessionId();
  if (existing) return existing;
  const sessionId = newId();
  await storage.setSessionId(sessionId);
  return sessionId;
};
