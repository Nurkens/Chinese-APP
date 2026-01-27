import api from './api';

export const tutorAPI = {
  chat: async (message: string) => {
    const response = await api.post('/tutor/chat', { message });
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/tutor/history');
    return response.data;
  },

  clearHistory: async () => {
    const response = await api.post('/tutor/history/clear');
    return response.data;
  },

  triggerEmotion: async (emotion: string) => {
    const response = await api.post(`/tutor/emotion/${emotion}`);
    return response.data;
  },
};
