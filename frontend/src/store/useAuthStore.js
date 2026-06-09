import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: async (username, password) => {
    try {
      const response = await api.post('token/', { username, password });
      const { access, refresh } = response.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refresh', refresh);
      
      // Fetch user profile
      const profileRes = await api.get('users/me/');
      const userData = profileRes.data;
      
      localStorage.setItem('user', JSON.stringify(userData));
      set({ token: access, user: userData, isAuthenticated: true });
      return true;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  isAdmin: () => get().user?.role === 'ADMIN',
  isPharmacist: () => get().user?.role === 'PHARMACIST',
  isCashier: () => get().user?.role === 'CASHIER',
  
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (token && !get().user) {
      try {
        const profileRes = await api.get('users/me/');
        set({ user: profileRes.data, isAuthenticated: true });
      } catch (err) {
        get().logout();
      }
    }
  }
}));

export default useAuthStore;
