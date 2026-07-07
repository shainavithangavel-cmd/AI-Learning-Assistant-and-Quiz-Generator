import { create } from 'zustand';
import api from '../api/axios';

const useQuizStore = create((set) => ({
  quizzes: [],
  currentQuiz: null,
  assignments: [],
  loading: false,
  error: null,

  fetchQuizzes: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/quizzes');
      set({ quizzes: res.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch quizzes', loading: false });
    }
  },

  fetchQuiz: async (id) => {
    try {
      const res = await api.get(`/quizzes/${id}`);
      set({ currentQuiz: res.data });
      return res.data;
    } catch (err) {
      return null;
    }
  },

  createQuiz: async (data) => {
    try {
      const res = await api.post('/quizzes', data);
      set((state) => ({ quizzes: [...state.quizzes, res.data] }));
      return { success: true, quiz: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Failed to create quiz' };
    }
  },

  deleteQuiz: async (id) => {
    try {
      await api.delete(`/quizzes/${id}`);
      set((state) => ({
        quizzes: state.quizzes.filter((q) => q.id !== id),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Failed to delete quiz' };
    }
  },

  publishQuiz: async (id) => {
    try {
      const res = await api.patch(`/quizzes/${id}/publish`);
      set((state) => ({
        quizzes: state.quizzes.map((q) => (q.id === id ? res.data : q)),
        currentQuiz: res.data,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Publish failed' };
    }
  },

  assignQuiz: async (quizId, studentIds) => {
    try {
      const res = await api.post('/quiz-assignments', {
        quiz_id: quizId,
        student_ids: studentIds,
      });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Assignment failed' };
    }
  },

  fetchAssignmentsForQuiz: async (quizId) => {
    try {
      const res = await api.get(`/quiz-assignments/quiz/${quizId}`);
      set({ assignments: res.data });
      return res.data;
    } catch (err) {
      return [];
    }
  },
}));

export default useQuizStore;