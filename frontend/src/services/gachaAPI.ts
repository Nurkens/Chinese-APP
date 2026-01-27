import api from './api';

export const gachaAPI = {
  pull: async (pullType: 'single' | 'ten') => {
    const response = await api.post('/gacha/pull', { pullType });
    return response.data;
  },

  getPityState: async () => {
    const response = await api.get('/gacha/pity');
    return response.data;
  },

  getAllCards: async () => {
    const response = await api.get('/gacha/cards');
    return response.data;
  },

  getCardsByRarity: async (rarity: 'SSR' | 'SR' | 'R') => {
    const response = await api.get(`/gacha/cards/${rarity}`);
    return response.data;
  },
};
