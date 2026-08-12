import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

export const quizApi = {
  getTodayQuiz: () =>
    axiosClient.get('/api/v1/quizzes/today').then(unwrap),

  submitTodayQuiz: (quizId, submittedAnswer) =>
    axiosClient.post('/api/v1/quizzes/today/submit', { quizId, submittedAnswer }).then(unwrap),
};
