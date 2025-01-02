// src/frontend/app/store/flowStore.ts
import { create } from 'zustand';

interface FlowState {
  generatedFlow: string;
  setGeneratedFlow: (flow: string) => void;
}

const useFlowStore = create<FlowState>((set) => ({
  generatedFlow: '',
  setGeneratedFlow: (flow) => set({ generatedFlow: flow }),
}));

export default useFlowStore;
