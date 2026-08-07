import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;

// data 필드 값이 null인 것도 유효한 응답(예: 하이라이트 없음)이므로 ?? 대신 명시적으로 분기한다.
const unwrapNullable = (response) =>
    response.data && Object.prototype.hasOwnProperty.call(response.data, 'data')
        ? response.data.data
        : response.data;

export const scoreApi = {
    getScore: () =>
        axiosClient.get('/api/v1/scores').then(unwrap),

    getScoreHistories: (size = 7) =>
        axiosClient.get('/api/v1/scores/histories', {params: {size}}).then(unwrap),

    getAnalysisByReason: () =>
        axiosClient.get('/api/v1/scores/analysis/by-reason').then(unwrap),

    getAnalysisSummary: () =>
        axiosClient.get('/api/v1/scores/analysis/summary').then(unwrap),

    getAnalysisHighlight: () =>
        axiosClient.get('/api/v1/scores/analysis/highlight').then(unwrapNullable),

    postScheduler: () =>
        axiosClient.post('/api/v1/admin/scores/run-scheduler').then(unwrap)
};