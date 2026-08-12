import axiosClient from './axiosClient';
import { compressImageFile, fileToBase64 } from './imageFileUtils';

const unwrap = (response) => response.data?.data ?? response.data;

export const fridgePhotoApi = {
  prepareImage: (file) => compressImageFile(file),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return axiosClient.post('/api/v1/fridge-photos/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap);
  },

  analyzeWithAgent: async (fridgePhotoAnalysisId, file) => {
    const imageBase64 = await fileToBase64(file);
    const response = await fetch('/agent/v1/fridge-photos/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fridgePhotoAnalysisId,
        imageBase64,
        mimeType: file.type || 'image/jpeg',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || '냉장고 사진 분석에 실패했습니다.');
    }

    return response.json();
  },

  saveAnalysisResult: (fridgePhotoAnalysisId, data) =>
    axiosClient.post(`/api/v1/fridge-photos/${fridgePhotoAnalysisId}/analysis-results`, data).then(unwrap),

  getItems: (fridgePhotoAnalysisId) =>
    axiosClient.get(`/api/v1/fridge-photos/${fridgePhotoAnalysisId}/items`).then(unwrap),

  updateItem: (fridgePhotoItemId, data) =>
    axiosClient.patch(`/api/v1/fridge-photos/items/${fridgePhotoItemId}`, data).then(unwrap),

  rejectItem: (fridgePhotoItemId) =>
    axiosClient.patch(`/api/v1/fridge-photos/items/${fridgePhotoItemId}/reject`).then(unwrap),

  registerToFridge: (fridgePhotoAnalysisId, fridgePhotoItemIds) =>
    axiosClient.post(`/api/v1/fridge-photos/${fridgePhotoAnalysisId}/fridge-items`, { fridgePhotoItemIds }).then(unwrap),
};
