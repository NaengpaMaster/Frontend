import { create } from 'zustand';

const useAuthStore = create((set) => ({
  currentUser: null,
  showMyPage: false,
  showAdmin: false,
  setCurrentUser: (user) => set({ currentUser: user }),
  setShowMyPage: (val) => set({ showMyPage: val }),
  setShowAdmin: (val) => set({ showAdmin: val }),
}));

export default useAuthStore;
