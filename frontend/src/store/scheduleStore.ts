import { create } from 'zustand';
import type { ClassEvent } from '../types';
import { api } from '../api/client';

type ScheduleState = {
  classes: ClassEvent[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  upsert: (classEvent: ClassEvent) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  classes: [],
  hydrated: false,
  hydrate: async () => {
    const classes = await api.getSchedule();
    set({ classes, hydrated: true });
  },
  upsert: async (classEvent) => {
    const next = [...get().classes.filter((item) => item.id !== classEvent.id), classEvent];
    set({ classes: next });
    await api.saveSchedule(next);
  },
  remove: async (id) => {
    const next = get().classes.filter((item) => item.id !== id);
    set({ classes: next });
    await api.saveSchedule(next);
  },
}));
