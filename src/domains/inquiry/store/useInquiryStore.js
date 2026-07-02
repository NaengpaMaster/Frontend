import { create } from 'zustand';
import { inquiriesApi, adminInquiriesApi } from '@/apis/inquiriesApi';
import { mockUsers } from '@/shared/data/mockData';

const toViewInquiry = (inq) => ({
  id: inq.inquiryId,
  subject: inq.title,
  content: inq.content,
  status: inq.isAnswered ? 'answered' : 'pending',
  answer: inq.answerContent ?? undefined,
  createdAt: inq.createdAt ? inq.createdAt.split('T')[0] : '',
});

const toAdminViewInquiry = (inq) => ({
  id: inq.inquiryId,
  answerId: inq.answerId,
  userId: inq.memberId,
  userName: inq.nickname,
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

  adminInquiries: [],
  adminLoading: false,

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

  fetchAdminInquiries: async () => {
    set({ adminLoading: true, error: null });
    try {
      const page = await adminInquiriesApi.getAll({ size: 100, sort: 'createdAt,desc' });
      const list = page?.content ?? [];
      const details = await Promise.all(list.map((item) => adminInquiriesApi.getById(item.inquiryId)));
      set({ adminInquiries: details.map(toAdminViewInquiry) });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ adminLoading: false });
    }
  },

  adminAnswerInquiry: async (id, answer) => {
    const inquiry = get().adminInquiries.find((q) => q.id === id);
    if (inquiry?.answerId) {
      await adminInquiriesApi.updateAnswer(id, inquiry.answerId, answer);
    } else {
      await adminInquiriesApi.createAnswer(id, answer);
    }
    await get().fetchAdminInquiries();
  },

  adminDeleteInquiry: async (id) => {
    await adminInquiriesApi.delete(id);
    await get().fetchAdminInquiries();
  },

  adminDeleteAnswer: async (id) => {
    const inquiry = get().adminInquiries.find((q) => q.id === id);
    if (!inquiry?.answerId) return;
    await adminInquiriesApi.deleteAnswer(id, inquiry.answerId);
    await get().fetchAdminInquiries();
  },

  setUsers: (usersOrFn) => set((state) => ({
    users: typeof usersOrFn === 'function'
      ? usersOrFn(state.users)
      : usersOrFn,
  })),
}));

export default useInquiryStore;
