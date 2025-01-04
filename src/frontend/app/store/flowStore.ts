// src/frontend/app/store/flowStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FlowState {
  generatedFlow: string;
  setGeneratedFlow: (flow: string) => void;
  resetFlow: () => void;
}

const useFlowStore = create<FlowState>()(
  persist(
    (set) => ({
      generatedFlow: '',
      setGeneratedFlow: (flow) => set({ generatedFlow: flow }),
      resetFlow: () => set({ generatedFlow: '' }),
    }),
    {
      name: 'flow-storage', // ローカルストレージのキー
      getStorage: () => localStorage, // 永続化ストレージ
    }
  )
);

export default useFlowStore;
