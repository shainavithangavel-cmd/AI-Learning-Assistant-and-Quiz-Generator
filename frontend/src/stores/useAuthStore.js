import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('user_data');
      return stored ? JSON.parse(stored) : null; //convert it back to json.if no user data return null.
    } catch { return null; } //corrupted or invalid data in ls.so return null.prevents from crashing.
  })(),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user_id, name, role } = res.data;

      const userData = { id: user_id, name, role };
      localStorage.setItem('token', access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));

      set({ token: access_token, user: userData, loading: false, error: null });
      return { success: true, role };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check your credentials.';
      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    set({ user: null, token: null });
  },

  restoreUser: (userData) => {
    set({ user: userData });
  },
}));

export default useAuthStore;
