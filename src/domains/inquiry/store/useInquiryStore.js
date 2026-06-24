import { create } from 'zustand';
import { mockInquiries, mockUsers } from '@/shared/data/mockData';

const useInquiryStore = create((set) => ({
  inquiries: mockInquiries,
  users: mockUsers,

  addInquiry: (inquiry) => set((state) => ({
    inquiries: [inquiry, ...state.inquiries],
  })),

  updateInquiry: (id, subject, content) => set((state) => ({
    inquiries: state.inquiries.map((q) => q.id === id ? { ...q, subject, content } : q),
  })),

  deleteInquiry: (id) => set((state) => ({
    inquiries: state.inquiries.filter((q) => q.id !== id),
  })),

  answerInquiry: (id, answer) => set((state) => ({
    inquiries: state.inquiries.map((q) => q.id === id ? { ...q, answer, status: 'answered' } : q),
  })),

  deleteAnswer: (id) => set((state) => ({
    inquiries: state.inquiries.map((q) => q.id === id ? { ...q, answer: undefined, status: 'pending' } : q),
  })),

  setUsers: (usersOrFn) => set((state) => ({
    users: typeof usersOrFn === 'function'
      ? usersOrFn(state.users)
      : usersOrFn,
  })),
}));

export default useInquiryStore;
