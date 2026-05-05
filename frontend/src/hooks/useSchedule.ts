import { useEffect } from 'react';
import { useScheduleStore } from '../store/scheduleStore';

export const useSchedule = () => {
  const store = useScheduleStore();
  useEffect(() => {
    if (!store.hydrated) void store.hydrate();
  }, [store]);
  return store;
};
