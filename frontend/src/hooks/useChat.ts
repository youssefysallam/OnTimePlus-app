import { useCallback } from 'react';
import { api } from '../api/client';
import { useChatStore } from '../store/chatStore';
import { useScheduleStore } from '../store/scheduleStore';
import { newId } from '../utils/uuid';

export const useChat = () => {
  const { messages, generating, addMessage, setGenerating } = useChatStore();
  const classes = useScheduleStore((state) => state.classes);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || generating) return;
      addMessage({ id: newId(), role: 'user', text: trimmed, timestamp: Date.now() });
      setGenerating(true);
      try {
        const reply = await api.sendMessage(trimmed, classes);
        addMessage({
          id: newId(),
          role: 'bot',
          text: reply.answer.recommendation,
          timestamp: Date.now(),
          retrieved: reply.retrieved.map((r) => ({
            id: r.doc.id,
            source: r.retriever,
            text: r.doc.content,
            score: r.score,
          })),
        });
      } finally {
        setGenerating(false);
      }
    },
    [addMessage, classes, generating, setGenerating],
  );

  return { messages, generating, send, addMessage };
};
