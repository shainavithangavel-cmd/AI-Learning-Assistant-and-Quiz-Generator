import { create } from 'zustand';
import api from '../api/axios';

const useAttemptStore = create((set) => ({
  assignments: [],
  currentAttempt: null,
  result: null,
  loading: false,
  error: null,

  fetchAssignments: async (studentId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/quiz-assignments/student/${studentId}`);
      set({ assignments: res.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch assignments', loading: false });
    }
  },

  startAttempt: async (assignmentId) => {
    try {
      const res = await api.post('/quiz-attempts/start', { assignment_id: assignmentId });
      set({ currentAttempt: { id: res.data.attempt_id } });
      return { success: true, attemptId: res.data.attempt_id };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Failed to start attempt' };
    }
  },

  submitAttempt: async (attemptId, answers) => {
    set({ loading: true });
    try {
      const res = await api.post(`/quiz-attempts/${attemptId}/submit`, { answers });
      set({ loading: false });
      return { success: true, data: res.data };
    } catch (err) {
      set({ loading: false });
      return { success: false, error: err.response?.data?.detail || 'Submission failed' };
    }
  },

  fetchResult: async (attemptId) => {
    set({ loading: true });
    try {
      const res = await api.get(`/quiz-attempts/${attemptId}/result`);
      set({ result: res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ loading: false });
      return null;
    }
  },

  clearResult: () => set({ result: null }),
}));

export default useAttemptStore;
