import { create } from 'zustand';

interface ModelState {
  selectedModel: { value: string; label: string };
  setSelectedModel: (model: { value: string; label: string }) => void;
}

export const useModelStore = create<ModelState>((set) => ({
  selectedModel: { value: 'Azure-gpt-4o-mini', label: 'Azure-GPT-4o-mini' },
  setSelectedModel: (model) => set({ selectedModel: model }),
}));
