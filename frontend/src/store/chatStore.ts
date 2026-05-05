import { create } from 'zustand';
import type { Message } from '../types';

type ChatState = {
  messages: Message[];
  generating: boolean;
  setGenerating: (generating: boolean) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  generating: false,
  setGenerating: (generating) => set({ generating }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
}));
