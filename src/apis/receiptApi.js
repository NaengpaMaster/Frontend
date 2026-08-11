import axiosClient from './axiosClient';

const unwrap = (response) => response.data?.data ?? response.data;
const AGENT_BASE_URL = process.env.NEXT_PUBLIC_AGENT_BASE_URL || 'http://localhost:8000';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const receiptApi = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return axiosClient.post('/api/v1/receipts/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap);
  },

  analyzeWithAgent: async (receiptAnalysisId, file) => {
    const imageBase64 = await fileToBase64(file);
    const response = await fetch(`${AGENT_BASE_URL}/agent/v1/receipts/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiptAnalysisId,
        imageBase64,
        mimeType: file.type || 'image/jpeg',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || '영수증 OCR 분석에 실패했습니다.');
    }

    return response.json();
  },

  saveOcrResult: (receiptAnalysisId, data) =>
    axiosClient.post(`/api/v1/receipts/${receiptAnalysisId}/ocr-results`, data).then(unwrap),

  getItems: (receiptAnalysisId) =>
    axiosClient.get(`/api/v1/receipts/${receiptAnalysisId}/items`).then(unwrap),

  updateItem: (receiptItemId, data) =>
    axiosClient.patch(`/api/v1/receipts/items/${receiptItemId}`, data).then(unwrap),

  rejectItem: (receiptItemId) =>
    axiosClient.patch(`/api/v1/receipts/items/${receiptItemId}/reject`).then(unwrap),

  registerToFridge: (receiptAnalysisId, receiptItemIds) =>
    axiosClient.post(`/api/v1/receipts/${receiptAnalysisId}/fridge-items`, { receiptItemIds }).then(unwrap),
};
