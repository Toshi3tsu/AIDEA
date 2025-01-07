// src/frontend/app/store/chatStore.ts
import { create } from 'zustand';

interface ChatMessage {
  sender: 'user' | 'ai';
  message: string;
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  resetMessages: () => void;
}

const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  resetMessages: () => set({ messages: [] }),
}));

export default useChatStore;
