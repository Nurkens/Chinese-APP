import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  guestLogin: async () => {
    const response = await api.post('/auth/guest');
    return response.data;
  },
};

// Words API
export const wordsAPI = {
  getTodayWord: async () => {
    const response = await api.get('/words/today');
    return response.data;
  },

  getWordsByHskLevel: async (level: number) => {
    const response = await api.get(`/words/hsk/${level}`);
    return response.data;
  },

  seedWords: async () => {
    const response = await api.post('/words/seed');
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  getProgress: async () => {
    const response = await api.get('/user/progress');
    return response.data;
  },

  updateStreak: async () => {
    const response = await api.post('/user/progress/streak');
    return response.data;
  },

  markWordAsLearned: async (wordId: string) => {
    const response = await api.post(`/user/words/${wordId}/learn`);
    return response.data;
  },

  getLearnedWords: async () => {
    const response = await api.get('/user/words/learned');
    return response.data;
  },
};

// SRS (Spaced Repetition) API
export const srsAPI = {
  getDueCards: async (limit: number = 20) => {
    const response = await api.get('/srs/due', { params: { limit } });
    return response.data;
  },

  getNewCards: async (hskLevel: number = 1, limit: number = 10) => {
    const response = await api.get('/srs/new', { params: { hskLevel, limit } });
    return response.data;
  },

  getReviewStats: async () => {
    const response = await api.get('/srs/stats');
    return response.data;
  },

  getIntervalPreview: async (wordId: string) => {
    const response = await api.get(`/srs/preview/${wordId}`);
    return response.data;
  },

  submitReview: async (wordId: string, quality: 'again' | 'hard' | 'good' | 'easy') => {
    const response = await api.post('/srs/review', { wordId, quality });
    return response.data;
  },

  getReviewSession: async (newLimit: number = 5, reviewLimit: number = 15) => {
    const response = await api.get('/srs/session', { params: { newLimit, reviewLimit } });
    return response.data;
  },
};

// Goals API
export const goalsAPI = {
  getUserGoals: async () => {
    const response = await api.get('/goals');
    return response.data;
  },

  getUserAchievements: async () => {
    const response = await api.get('/goals/achievements');
    return response.data;
  },

  createGoal: async (goalData: any) => {
    const response = await api.post('/goals', goalData);
    return response.data;
  },

  updateGoalProgress: async (goalId: string, current: number) => {
    const response = await api.post(`/goals/${goalId}/progress`, { current });
    return response.data;
  },
};

export default api;
