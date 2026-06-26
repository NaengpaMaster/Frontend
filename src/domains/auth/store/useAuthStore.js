import { create } from 'zustand';

const useAuthStore = create((set) => ({
  currentUser: null,
  authLoading: true,
  showMyPage: false,
  showAdmin: false,
  setCurrentUser: (user) => set({ currentUser: user }),
  setAuthLoading: (authLoading) => set({ authLoading }),
  setShowMyPage: (val) => set({ showMyPage: val }),
  setShowAdmin: (val) => set({ showAdmin: val }),
  resetAuth: () => set({
    currentUser: null,
    showMyPage: false,
    showAdmin: false,
  }),
}));

export default useAuthStore;
