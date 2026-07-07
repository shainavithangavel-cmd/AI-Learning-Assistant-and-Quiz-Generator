import { create } from 'zustand'; //store contains shared frontend data and functions
import api from '../api/axios';

const useUserStore = create((set) => ({   // set update the values inside the store
  users: [],
  loading: false, //tells if the api req is currently running
  error: null,//stores error messages from backend

  fetchUsers: async (role = null) => { //role is optional
    set({ loading: true, error: null });
    try {
      const params = role ? { role } : {}; //create query parameters
      const res = await api.get('/admin/users', { params }); //getv req to backend and wait until backend sends response.
      set({ users: res.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Failed to fetch users', loading: false });
    }
  },

  createUser: async (userData) => {
    set({ loading: true, error: null }); //loading gets started and old errro gets cleared before api req.
    try {
      const res = await api.post('/admin/users', userData);
      set((state) => ({   //zustand set function takes a callback with the current state and returns the new state.
        users: [...state.users, res.data],
        loading: false,
      }));
      return { success: true }; //tells component user creation worked.
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create user';
      set({ error: msg, loading: false }); //stores the error message in zustand store
      return { success: false, error: msg }; //tells comppnent user creation failed and passes eorror message to the compnnt.
    }
  },

  deleteUser: async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      set((state) => ({
        users: state.users.filter((u) => u.id !== userId), //deletes user from the frontend.
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Delete failed' };
    }
  },
}));

export default useUserStore;
