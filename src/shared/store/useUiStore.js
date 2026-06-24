import { create } from 'zustand';

const useUiStore = create((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export default useUiStore;
