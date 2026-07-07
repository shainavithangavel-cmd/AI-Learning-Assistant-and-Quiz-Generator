import { create } from 'zustand';

const useCreateQuizFormStore = create((set) => ({
  activeStep: 0, //current step of the form
  form: {
    topic_id: '',
    quiz_name: '',
    difficulty: 'MEDIUM',
    question_count: 5,
    question_type: 'MCQ',
    time_limit_minutes: 5, 
  },
  selectedNoteIds: [],

  setActiveStep: (step) => set({ activeStep: step }),//update the current step of the form

  setForm: (newForm) => set((state) => ({ //update the form data with new values.
    form: { ...state.form, ...newForm }
  })),

  setSelectedNoteIds: (ids) => set({ selectedNoteIds: ids }),//update the selected note ids in form store.

  resetForm: () => set({//it will reset the form to initial value.
    activeStep: 0,
    form: {
      topic_id: '',
      quiz_name: '',
      difficulty: 'MEDIUM',
      question_count: 5,
      question_type: 'MCQ',
      time_limit_minutes: 5,
    },
    selectedNoteIds: [], //reset the selected note ids to empty array.
  }),
}));

export default useCreateQuizFormStore;