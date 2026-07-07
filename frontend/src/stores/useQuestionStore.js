import { create } from 'zustand';
import api from '../api/axios';

const useQuestionStore = create((set) => ({
  questions: [],
  loading: false,
  generating: false,
  error: null,

  fetchQuestions: async (quizId) => {
    set({ loading: true, error: null }); //set loading to true and clear any previous errors.
    try {
      const res = await api.get(`/questions/quiz/${quizId}`); 
      set({ questions: res.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch questions', loading: false });
    }
  },

  generateQuestions: async (payload) => { //payoad is the data sent to the backend for AI generation.
    set({ generating: true, error: null });
    try {
      const res = await api.post('/ai/generate-quiz', payload);
      // Add newly generated to the list
      set((state) => ({
        questions: [...state.questions, ...res.data],
        generating: false,
      }));
      return { success: true, questions: res.data };
    } catch (err) {
      const msg = err.response?.data?.detail || 'AI generation failed';
      set({ generating: false, error: msg });
      return { success: false, error: msg };
    }
  },

  approveQuestion: async (id) => {
    try {
      const res = await api.patch(`/questions/${id}/approve`);
      set((state) => ({
        questions: state.questions.map((q) => (q.id === id ? res.data : q)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Approve failed' };
    }
  },

  rejectQuestion: async (id) => {
    try {
      const res = await api.patch(`/questions/${id}/reject`);
      set((state) => ({
        questions: state.questions.map((q) => (q.id === id ? res.data : q)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Reject failed' };
    }
  },

  editQuestion: async (id, data) => {
    try {
      const res = await api.put(`/questions/${id}`, data);
      set((state) => ({
        questions: state.questions.map((q) => (q.id === id ? res.data : q)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Edit failed' };
    }
  },

  regenerateQuestion: async (id) => {
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, _regenerating: true } : q
      ),
    }));
    try {
      const res = await api.post(`/questions/${id}/regenerate`);
      // Replace old question (now rejected) and add new one
      set((state) => ({
        questions: state.questions
          .map((q) => {
            if (q.id === id) return { ...q, status: 'REJECTED', _regenerating: false };
            return q;
          })
          .concat(res.data),
      }));
      return { success: true };
    } catch (err) {
      set((state) => ({
        questions: state.questions.map((q) =>
          q.id === id ? { ...q, _regenerating: false } : q
        ),
      }));
      return { success: false, error: err.response?.data?.detail || 'Regenerate failed' };
    }
  },

  clearQuestions: () => set({ questions: [] }),
}));

export default useQuestionStore;
