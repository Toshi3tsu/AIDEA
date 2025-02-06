// src/frontend/app/store/chatStore.ts
import { create } from 'zustand';

interface MessageItem {
  sender: 'user' | 'ai';
  message: string;
  timestamp: string;
  source_name?: string | string[] | null | undefined;
  source_path?: string | null;
  source_ids?: string[] | null;
}

interface ChatState {
  messages: MessageItem[];
  selectedSourceIds: string[]; // ★ 選択された source_ids を chatStore で管理
  addMessage: (msg: MessageItem) => void;
  resetMessages: () => void;
  addSelectedSourceId: (sourceId: string) => void; // ★ source_ids を追加する関数
  removeSelectedSourceId: (sourceId: string) => void; // ★ source_ids を削除する関数
  resetSelectedSourceIds: () => void; // ★ source_ids をリセットする関数
}

const useChatStore = create<ChatState>((set) => ({
  messages: [],
  selectedSourceIds: [], // 初期状態は空
  addMessage: (msg: MessageItem) => set((state) => ({ messages: [...state.messages, msg] })),
  resetMessages: () => set({ messages: [] }),
  addSelectedSourceId: (sourceId: string) => set((state) => {
    if (state.selectedSourceIds.includes(sourceId)) {
      return state; // すでに存在する場合は何もしない
    }
    return { selectedSourceIds: [...state.selectedSourceIds, sourceId] }; // 新しい sourceId を追加
  }),
  removeSelectedSourceId: (sourceId: string) => set((state) => ({
    selectedSourceIds: state.selectedSourceIds.filter(id => id !== sourceId), // 特定の sourceId を削除
  })),
  resetSelectedSourceIds: () => set({ selectedSourceIds: [] }), // source_ids を空にする
}));

export default useChatStore;
