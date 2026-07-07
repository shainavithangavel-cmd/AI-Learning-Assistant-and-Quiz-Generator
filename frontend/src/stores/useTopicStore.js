import { create } from 'zustand';
import api from '../api/axios';

const useTopicStore = create((set) => ({
  topics: [],
  notes: [],
  loading: false,
  error: null,

  fetchTopics: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/topics');
      set({ topics: res.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch topics', loading: false });
    }
  },

  createTopic: async (data) => {
    try {
      const res = await api.post('/topics', data);
      set((state) => ({ topics: [...state.topics, res.data] }));
      return { success: true, topic: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Failed to create topic' };
    }
  },

  updateTopic: async (id, data) => {
    try {
      const res = await api.put(`/topics/${id}`, data);
      set((state) => ({
        topics: state.topics.map((t) => (t.id === id ? res.data : t)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Failed to update topic' };
    }
  },

  deleteTopic: async (id) => {
    try {
      await api.delete(`/topics/${id}`);
      set((state) => ({ topics: state.topics.filter((t) => t.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Failed to delete topic' };
    }
  },

  fetchNotes: async (topicId) => {
    set({ loading: true });
    try {
      const res = await api.get(`/learning-notes/topic/${topicId}`);
      set({ notes: res.data, loading: false });
    } catch (err) {
      set({ notes: [], loading: false });
    }
  },

  addNote: async (data) => {
    try {
      const res = await api.post('/learning-notes', data);
      set((state) => ({ notes: [...state.notes, res.data] }));
      return { success: true, note: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Failed to add note' };
    }
  },

  deleteNote: async (id) => {
    try {
      await api.delete(`/learning-notes/${id}`);
      set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to delete note' };
    }
  },
}));

export default useTopicStore;
