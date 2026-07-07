import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Alert, CircularProgress,
  Stepper, Step, StepLabel, Paper, Chip, Grid
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import useTopicStore from '../stores/useTopicStore';
import useQuizStore from '../stores/useQuizStore';
import useQuestionStore from '../stores/useQuestionStore';
import useCreateQuizFormStore from '../stores/useCreateQuizFormStore';

const stepHelpers = {
  0: {
    title: 'Step 1 — Quiz Details',
    tips: [
      'Choose a topic that already has learning notes added',
      'Give the quiz a clear name like "React Hooks - Week 2"',
      'Start with MEDIUM difficulty for first-time students',
      'Keep question count between 5–10 for a good quiz length',
      'MCQ questions are easiest for students to attempt',
    ],
    note: 'The quiz is NOT saved yet at this step.',
  },
  1: {
    title: 'Step 2 — Select Notes',
    tips: [
      'Select all notes for a comprehensive quiz',
      'Select specific notes to focus on a particular concept',
      'More notes = more context for AI = better questions',
      'Make sure notes are detailed and not too short',
    ],
    note: 'AI will only generate questions from the notes you select.',
  },
  2: {
    title: 'Step 3 — Generate',
    tips: [
      'AI reads your selected notes and generates questions',
      'Generation usually takes 10–20 seconds',
      'After generation you can approve, edit, or reject each question',
      'The quiz is saved ONLY after this step succeeds',
    ],
    note: 'If generation fails, nothing is saved — just try again.',
  },
};

export default function CreateQuizPage() {
  const navigate = useNavigate();
  const { topics, notes, fetchTopics, fetchNotes } = useTopicStore();
  const { createQuiz, deleteQuiz } = useQuizStore();
  const { generateQuestions, clearQuestions } = useQuestionStore();

  const {
    activeStep, form, selectedNoteIds,
    setActiveStep, setForm, setSelectedNoteIds, resetForm
  } = useCreateQuizFormStore();

  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const steps = ['Quiz Details', 'Select Notes', 'Generate'];

  React.useEffect(() => {
    fetchTopics();
    clearQuestions();
  }, []);

  React.useEffect(() => {
    if (form.topic_id) fetchNotes(form.topic_id); //whenever selected topic changes
  }, [form.topic_id]);

  const toggleNote = (id) => { //select or deselect a note
    const updated = selectedNoteIds.includes(id) //if note already selected,remove that
      ? selectedNoteIds.filter((n) => n !== id)
      : [...selectedNoteIds, id];
    setSelectedNoteIds(updated);
  };
//step 0 validation
  const handleNextToNotes = () => {
    setError('');
    if (!form.topic_id) { setError('Please select a topic'); return; }
    if (!form.quiz_name.trim()) { setError('Please enter a quiz name'); return; }
    if (form.question_count < 1 || form.question_count > 20) {
      setError('Question count must be between 1 and 20'); return;
    }
    setActiveStep(1);//moves to next step if validated
  };

  const handleNextToGenerate = () => {
    setError('');
    setActiveStep(2);
  };

  const handleGenerate = async () => {
    setError('');
    const selectedNotes = notes.filter((n) => selectedNoteIds.includes(n.id)); //gets the notes selected by trainer
    const notesText = selectedNotes.length > 0
      ? selectedNotes.map((n) => n.notes_text).join('\n\n')
      : notes.map((n) => n.notes_text).join('\n\n');

    if (!notesText.trim()) {
      setError('No notes found. Please add notes to this topic first.');
      return;
    }

    setLoading(true);

    const quizResult = await createQuiz({
      topic_id: Number(form.topic_id),
      quiz_name: form.quiz_name.trim(),
      difficulty: form.difficulty,
      question_count: Number(form.question_count),
      // form.time_limit_minutes is now stored as a number or null (never ''),
      // so this coercion is clean and unambiguous
      time_limit_minutes: form.time_limit_minutes ? Number(form.time_limit_minutes) : null,
    });

    if (!quizResult.success) {
      setError(quizResult.error);
      setLoading(false);
      return;
    }

    const quizId = quizResult.quiz.id;
    const genResult = await generateQuestions({
      quiz_id: quizId,
      topic_id: Number(form.topic_id),
      notes_text: notesText,
      question_count: Number(form.question_count),
      difficulty: form.difficulty,
      question_type: form.question_type,
    });

    setLoading(false);

    if (genResult.success) {
      resetForm();
      navigate(`/trainer/questions/${quizId}`);
    } else {
      await deleteQuiz(quizId);
      setError(genResult.error || 'AI generation failed. Please try again.');
    }
  };
//selects the helper text based on the current step
  const helper = stepHelpers[activeStep];

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box>
          <Typography className="page-title">Create Quiz</Typography>
          <Typography className="page-subtitle">
            Fill in the details and generate questions using AI
          </Typography>
        </Box>
      </Box>
//loops through the steps 
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}> 
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step> //key uniquely identifies each step and label represents the steps
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>
      )}

      <Grid container spacing={3}>
        {/* left — form */}
        <Grid item xs={12} md={8}>

          {/* Step 0 — Quiz Details */}
          {activeStep === 0 && (
            <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography sx={{ fontWeight: 600, mb: 2.5, fontSize: 15 }}>
                Quiz Information
              </Typography>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Select Topic *</InputLabel>
                <Select
                  value={form.topic_id}
                  label="Select Topic *"
                  onChange={(e) => setForm({ topic_id: e.target.value })}
                >
                  {topics.length === 0 && (
                    <MenuItem disabled>No topics found — create a topic first</MenuItem>
                  )}
                  {topics.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Quiz Name *"
                value={form.quiz_name}
                fullWidth size="small" sx={{ mb: 2 }}
                onChange={(e) => setForm({ quiz_name: e.target.value })}
                placeholder="e.g. React Hooks Quiz"
              />

              <Box className="form-row" sx={{ mb: 2 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={form.difficulty}
                    label="Difficulty"
                    onChange={(e) => setForm({ difficulty: e.target.value })}
                  >
                    <MenuItem value="EASY">Easy</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HARD">Hard</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Number of Questions"
                  type="number" size="small" fullWidth
                  value={form.question_count}
                  onChange={(e) => setForm({ question_count: Math.min(20, Math.max(1, Number(e.target.value))) })}
                  inputProps={{ min: 1, max: 20 }}
                  helperText="Maximum 20 questions"
                />
              </Box>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={form.question_type}
                  label="Question Type"
                  onChange={(e) => setForm({ question_type: e.target.value })}
                >
                  <MenuItem value="MCQ">Multiple Choice (MCQ)</MenuItem>
                  <MenuItem value="TRUE_FALSE">True / False</MenuItem>
                  <MenuItem value="SHORT_ANSWER">Short Answer</MenuItem>
                </Select>
              </FormControl>

              {/* Time limit field
                BUG A FIX: onChange now stores null (not '') when the field is cleared.
                  Before: e.target.value === '' ? '' : Number(...)
                  After:  e.target.value === '' ? null : Number(...)
                  The empty string was silently leaking into the store and overriding
                  the null default we set in useCreateQuizFormStore.

                BUG B FIX: value uses ?? '' so React always receives a string for the
                  controlled input. Passing null as value causes React to flip the input
                  from controlled→uncontrolled and then back, which breaks typing.
                  The store still holds null when empty; only the display uses ''.
              */}
              <TextField
  label="Time Limit (minutes)"
  type="number"
  name="quiz-time-limit"
  autoComplete="off"
  value={form.time_limit_minutes}
  fullWidth size="small" sx={{ mb: 3 }}
  onChange={(e) => setForm({
    time_limit_minutes: e.target.value === '' ? '' : Math.min(15, Math.max(1, Number(e.target.value)))
  })}
  inputProps={{ min: 1, max: 15, autoComplete: 'off' }}
  placeholder="e.g. 5"
  helperText={
    form.time_limit_minutes
      ? `Students will have ${form.time_limit_minutes} minute(s) to complete this quiz (max 60)`
      : 'No time limit — students can take as long as they need'
  }
/>

              <Button
                variant="contained" onClick={handleNextToNotes}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 4 }}
              >
                Next: Select Notes →
              </Button>
            </Paper>
          )}

          {/* Step 1 — Select Notes */}
          {activeStep === 1 && (
            <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 15 }}>
                Select Notes for AI
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#64748b', mb: 2.5 }}>
                Choose which notes to use. AI will read these to generate questions.
              </Typography>

              {notes.length === 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  No notes found for this topic. Please add notes first from Topics & Notes page.
                </Alert>
              )}

              {notes.map((note) => (
                <Box
                  key={note.id}
                  onClick={() => toggleNote(note.id)}
                  sx={{
                    border: `2px solid ${selectedNoteIds.includes(note.id) ? '#4f46e5' : '#e2e8f0'}`,
                    borderRadius: '8px', p: 2, mb: 1.5, cursor: 'pointer',
                    backgroundColor: selectedNoteIds.includes(note.id) ? '#f0f4ff' : 'white',
                    transition: 'all 0.15s',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#4f46e5' }}>
                      Note #{note.id}
                    </Typography>
                    {selectedNoteIds.includes(note.id) && (
                      <Chip label="Selected" size="small" color="primary" sx={{ fontSize: 10 }} />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    {note.notes_text.slice(0, 200)}{note.notes_text.length > 200 ? '...' : ''}
                  </Typography>
                </Box>
              ))}

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button onClick={() => setActiveStep(0)} sx={{ textTransform: 'none' }}>
                  ← Back
                </Button>
                <Button
                  variant="contained" onClick={handleNextToGenerate}
                  disabled={notes.length === 0}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 4 }}
                >
                  Next: Generate →
                </Button>
              </Box>
            </Paper>
          )}

          {/* Step 2 — Generate */}
          {activeStep === 2 && (
            <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 15 }}>
                Ready to Generate
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#64748b', mb: 3 }}>
                Review your quiz settings below, then click Generate to let AI create questions.
              </Typography>

              <Box sx={{ background: '#f8fafc', borderRadius: '8px', p: 2, mb: 3 }}>
                {[
                  ['Quiz Name', form.quiz_name],
                  ['Topic', topics.find((t) => t.id === Number(form.topic_id))?.title || '—'],
                  ['Difficulty', form.difficulty],
                  ['Question Type', form.question_type],
                  ['Count', form.question_count],
                  ['Time Limit', form.time_limit_minutes ? `${form.time_limit_minutes} min` : 'No limit'],
                  ['Notes Selected', selectedNoteIds.length > 0 ? `${selectedNoteIds.length} note(s)` : 'All notes'],
                ].map(([k, v]) => (
                  <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6, borderBottom: '1px solid #e2e8f0', '&:last-child': { borderBottom: 'none' } }}>
                    <Typography sx={{ fontSize: 13, color: '#64748b' }}>{k}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{v}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button onClick={() => setActiveStep(1)} disabled={loading} sx={{ textTransform: 'none' }}>
                  ← Back
                </Button>
                <Button
                  variant="contained"
                  startIcon={loading ? null : <AutoAwesomeIcon />}
                  onClick={handleGenerate}
                  disabled={loading}
                  sx={{
                    textTransform: 'none', fontWeight: 600,
                    borderRadius: '8px', px: 4,
                    background: loading ? undefined : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={18} color="inherit" />
                      <span>Generating questions...</span>
                    </Box>
                  ) : 'Generate & Save Quiz'}
                </Button>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* right — helper panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{
            p: 2.5, borderRadius: '12px',
            border: '1px solid #e0e7ff', boxShadow: 'none',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
            position: 'sticky', top: 24,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LightbulbIcon sx={{ color: '#4f46e5', fontSize: 18 }} />
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#3730a3' }}>
                {helper.title}
              </Typography>
            </Box>

            {helper.tips.map((tip, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1.2 }}>
                <CheckCircleIcon sx={{ fontSize: 14, color: '#4f46e5', mt: 0.3, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, color: '#4338ca', lineHeight: 1.5 }}>{tip}</Typography>
              </Box>
            ))}

            <Box sx={{ mt: 2, p: 1.5, borderRadius: '6px', backgroundColor: '#ede9fe', border: '1px solid #c4b5fd' }}>
              <Typography sx={{ fontSize: 11, color: '#5b21b6', fontWeight: 600 }}>
                ℹ️ {helper.note}
              </Typography>
            </Box>

            <Box sx={{ mt: 2.5, display: 'flex', gap: 1 }}>
              {steps.map((s, i) => (
                <Box key={i} sx={{
                  flex: 1, height: 4, borderRadius: '4px',
                  backgroundColor: i <= activeStep ? '#4f46e5' : '#e2e8f0',
                  transition: 'background-color 0.3s',
                }} />
              ))}
            </Box>
            <Typography sx={{ fontSize: 11, color: '#64748b', mt: 0.5, textAlign: 'center' }}>
              Step {activeStep + 1} of {steps.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
