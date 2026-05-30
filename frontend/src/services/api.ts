import axios from 'axios';
import { Capacitor } from '@capacitor/core';


const getApiUrl = () => {
  // Сначала проверяем переменную окружения
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Затем проверяем нативную платформу
  if (Capacitor.isNativePlatform()) {
    return 'http://10.0.2.2:3000';
  }
  
  // По умолчанию для разработки
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiUrl();
console.log('API URL:', API_BASE_URL);

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

  getGoogleAuthUrl: () => {
    return `${API_BASE_URL}/auth/google`;
  },

  googleLoginWithToken: async (credential: string) => {
    const response = await api.post('/auth/google/token', { credential });
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
export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  avatar?: string;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  reminderEnabled: boolean;
  reminderTime: string; // HH:MM
  soundEnabled: boolean;
}

export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfilePayload) => {
    const response = await api.patch('/user/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/user/password', { currentPassword, newPassword });
    return response.data;
  },

  getSettings: async (): Promise<UserSettings> => {
    const response = await api.get('/user/settings');
    return response.data;
  },

  updateSettings: async (data: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.put('/user/settings', data);
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

// Friends API
export const friendsAPI = {
  getFriends: async () => {
    const response = await api.get('/friends');
    return response.data;
  },

  addFriend: async (tag: string) => {
    const response = await api.post('/friends/add', { tag });
    return response.data;
  },

  removeFriend: async (friendId: string) => {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  },

  searchByTag: async (tag: string) => {
    const response = await api.get('/friends/search', { params: { tag } });
    return response.data;
  },

  getGlobalLeaderboard: async () => {
    const response = await api.get('/leaderboard/global');
    return response.data;
  },

  getFriendsLeaderboard: async () => {
    const response = await api.get('/leaderboard/friends');
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

  deleteGoal: async (goalId: string) => {
    const response = await api.delete(`/goals/${goalId}`);
    return response.data;
  },
};

// Adaptive Learning API
export const adaptiveAPI = {
  getMetrics: async () => {
    const response = await api.get('/adaptive/metrics');
    return response.data;
  },

  getForgetCurve: async () => {
    const response = await api.get('/adaptive/forgetting-curve');
    return response.data;
  },

  getRecommendations: async () => {
    const response = await api.get('/adaptive/recommendations');
    return response.data;
  },

  adjustLevel: async () => {
    const response = await api.get('/adaptive/adjust-level');
    return response.data;
  },

  getInsights: async () => {
    const response = await api.get('/adaptive/insights');
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/adaptive/dashboard');
    return response.data;
  },
};

export default api;
