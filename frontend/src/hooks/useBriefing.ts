import { useCallback } from 'react';
import { api } from '../api/client';
import { useAlertsStore } from '../store/alertsStore';
import { useChatStore } from '../store/chatStore';
import { useScheduleStore } from '../store/scheduleStore';

export const useBriefing = () => {
  const addMessage = useChatStore((state) => state.addMessage);
  const classes = useScheduleStore((state) => state.classes);
  const alerts = useAlertsStore((state) => state.alerts);

  const fire = useCallback(async () => {
    const message = await api.getBriefingMessage(classes, alerts);
    addMessage(message);
  }, [addMessage, alerts, classes]);

  return { fire };
};
