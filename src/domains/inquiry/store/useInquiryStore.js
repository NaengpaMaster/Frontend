import { create } from 'zustand';
import { inquiriesApi } from '@/apis/inquiriesApi';
import { mockInquiries, mockUsers } from '@/shared/data/mockData';

const toViewInquiry = (inq) => ({
  id: inq.inquiryId,
  subject: inq.title,
  content: inq.content,
  status: inq.isAnswered ? 'answered' : 'pending',
  answer: inq.answerContent ?? undefined,
  createdAt: inq.createdAt ? inq.createdAt.split('T')[0] : '',
});

const useInquiryStore = create((set, get) => ({
  inquiries: [],
  loading: false,
  error: null,
  users: mockUsers,

  // 관리자 문의 관리 화면은 이번 작업 범위 밖이라 기존 목데이터를 그대로 유지한다.
  adminInquiries: mockInquiries,

  fetchInquiries: async () => {
    set({ loading: true, error: null });
    try {
      const page = await inquiriesApi.getAll({ size: 50, sort: 'createdAt,desc' });
      const list = page?.content ?? [];
      const details = await Promise.all(list.map((item) => inquiriesApi.getById(item.inquiryId)));
      set({ inquiries: details.map(toViewInquiry) });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addInquiry: async (subject, content) => {
    await inquiriesApi.create({ title: subject, content });
    await get().fetchInquiries();
  },

  updateInquiry: async (id, subject, content) => {
    await inquiriesApi.update(id, { title: subject, content });
    await get().fetchInquiries();
  },

  deleteInquiry: async (id) => {
    await inquiriesApi.delete(id);
    await get().fetchInquiries();
  },

  adminAnswerInquiry: (id, answer) => set((state) => ({
    adminInquiries: state.adminInquiries.map((q) => q.id === id ? { ...q, answer, status: 'answered' } : q),
  })),

  adminDeleteInquiry: (id) => set((state) => ({
    adminInquiries: state.adminInquiries.filter((q) => q.id !== id),
  })),

  adminDeleteAnswer: (id) => set((state) => ({
    adminInquiries: state.adminInquiries.map((q) => q.id === id ? { ...q, answer: undefined, status: 'pending' } : q),
  })),

  setUsers: (usersOrFn) => set((state) => ({
    users: typeof usersOrFn === 'function'
      ? usersOrFn(state.users)
      : usersOrFn,
  })),
}));

export default useInquiryStore;
