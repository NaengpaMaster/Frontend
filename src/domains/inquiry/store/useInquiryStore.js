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
  adminPendingCount: 0,
  adminAnsweredCount: 0,

  fetchInquiries: async ({ page = 0, size = 10 } = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await inquiriesApi.getAll({ page, size });
      const list = result?.content ?? [];
      const details = await Promise.all(list.map((item) => inquiriesApi.getById(item.inquiryId)));
      set({ inquiries: details.map(toViewInquiry) });
      return { totalPages: result?.totalPages ?? 0, totalElements: result?.totalElements ?? 0 };
    } catch (error) {
      set({ error: error.message });
      return { totalPages: 0, totalElements: 0 };
    } finally {
      set({ loading: false });
    }
  },

  addInquiry: async (subject, content) => {
    await inquiriesApi.create({ title: subject, content });
  },

  updateInquiry: async (id, subject, content) => {
    await inquiriesApi.update(id, { title: subject, content });
  },

  deleteInquiry: async (id) => {
    await inquiriesApi.delete(id);
  },

  fetchAdminInquiries: async ({ isAnswered, page = 0, size = 10 } = {}) => {
    set({ adminLoading: true, error: null });
    try {
      const sort = isAnswered ? 'createdAt,desc' : 'createdAt,asc';
      const result = await adminInquiriesApi.getAll({ isAnswered, page, size, sort });
      const list = result?.content ?? [];
      const details = await Promise.all(list.map((item) => adminInquiriesApi.getById(item.inquiryId)));
      set({ adminInquiries: details.map(toAdminViewInquiry) });
      return { totalPages: result?.totalPages ?? 0, totalElements: result?.totalElements ?? 0 };
    } catch (error) {
      set({ error: error.message });
      return { totalPages: 0, totalElements: 0 };
    } finally {
      set({ adminLoading: false });
    }
  },

  fetchAdminInquiryCounts: async () => {
    const [pending, answered] = await Promise.all([
      adminInquiriesApi.getAll({ isAnswered: false, page: 0, size: 1 }),
      adminInquiriesApi.getAll({ isAnswered: true, page: 0, size: 1 }),
    ]);
    set({
      adminPendingCount: pending?.totalElements ?? 0,
      adminAnsweredCount: answered?.totalElements ?? 0,
    });
  },

  adminAnswerInquiry: async (id, answer) => {
    const inquiry = get().adminInquiries.find((q) => q.id === id);
    if (inquiry?.answerId) {
      await adminInquiriesApi.updateAnswer(id, inquiry.answerId, answer);
    } else {
      await adminInquiriesApi.createAnswer(id, answer);
    }
  },

  adminDeleteInquiry: async (id) => {
    await adminInquiriesApi.delete(id);
  },

  adminDeleteAnswer: async (id) => {
    const inquiry = get().adminInquiries.find((q) => q.id === id);
    if (!inquiry?.answerId) return;
    await adminInquiriesApi.deleteAnswer(id, inquiry.answerId);
  },

  setUsers: (usersOrFn) => set((state) => ({
    users: typeof usersOrFn === 'function'
      ? usersOrFn(state.users)
      : usersOrFn,
  })),
}));

export default useInquiryStore;
