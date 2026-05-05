import { create } from 'zustand';
import type { Alert } from '../types';
import { api } from '../api/client';

type AlertsState = {
  alerts: Alert[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
};

export const useAlertsStore = create<AlertsState>((set) => ({
  alerts: [],
  hydrated: false,
  hydrate: async () => {
    const alerts = await api.getAlerts();
    set({ alerts, hydrated: true });
  },
}));
