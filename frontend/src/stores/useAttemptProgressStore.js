import { create } from 'zustand';

// keeps quiz attempt progress alive even if student navigates away and back
// keyed by assignmentId so different quizzes don't overwrite each other
const useAttemptProgressStore = create((set, get) => ({
  // progress data keyed by assignmentId
  // { [assignmentId]: { attemptId, questions, answers, quizName, timeLeft, timeLimit, startedAtTimestamp } }
  progress: {},

  getProgress: (assignmentId) => {
    return get().progress[assignmentId] || null;
  },

  initProgress: (assignmentId, data) => set((state) => ({
    progress: {
      ...state.progress,
      [assignmentId]: { ...data },
    },
  })),

  updateAnswer: (assignmentId, questionId, answer) => set((state) => {
    const existing = state.progress[assignmentId];
    if (!existing) return state;
    return {
      progress: {
        ...state.progress,
        [assignmentId]: {
          ...existing,
          answers: { ...existing.answers, [questionId]: answer },
        },
      },
    };
  }),

  updateTimeLeft: (assignmentId, timeLeft) => set((state) => {
    const existing = state.progress[assignmentId];
    if (!existing) return state;
    return {
      progress: {
        ...state.progress,
        [assignmentId]: { ...existing, timeLeft },
      },
    };
  }),

  // call this after quiz is submitted to clear its progress
  clearProgress: (assignmentId) => set((state) => {
    const copy = { ...state.progress };
    delete copy[assignmentId];
    return { progress: copy };
  }),
}));

export default useAttemptProgressStore;