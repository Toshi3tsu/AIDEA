import { create } from 'zustand';

interface ModelState {
  selectedModel: { value: string; label: string };
  setSelectedModel: (model: { value: string; label: string }) => void;
}

export const useModelStore = create<ModelState>((set) => ({
  selectedModel: { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
  setSelectedModel: (model) => set({ selectedModel: model }),
}));
