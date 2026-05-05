import { useEffect } from 'react';
import { useAlertsStore } from '../store/alertsStore';

export const useAlerts = () => {
  const store = useAlertsStore();
  useEffect(() => {
    if (!store.hydrated) void store.hydrate();
  }, [store]);
  return store;
};
