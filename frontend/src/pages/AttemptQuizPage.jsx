import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Alert,
  Paper, LinearProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import TimerIcon from '@mui/icons-material/Timer';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import api from '../api/axios';
import useAttemptStore from '../stores/useAttemptStore';
import useAuthStore from '../stores/useAuthStore';
import useAttemptProgressStore from '../stores/useAttemptProgressStore';

export default function AttemptQuizPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { startAttempt, submitAttempt, loading } = useAttemptStore();
  const { getProgress, initProgress, updateAnswer, updateTimeLeft, clearProgress } = useAttemptProgressStore();

  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localData, setLocalData] = useState(null);

  const timerRef = useRef(null);
  const questionsRef = useRef([]);
  const answersRef = useRef({});
  const attemptIdRef = useRef(null);
  const autoSubmittedRef = useRef(false);

  // BUG C + BUG D FIX:
  // handleAutoSubmit and startTimerInterval reference each other, creating a
  // circular useCallback dependency that causes stale closures and interval
  // recreation on every render. Break the cycle by storing each function in a
  // ref so they can always call the latest version without being listed as deps.
  const handleAutoSubmitRef = useRef(null);
  const startTimerIntervalRef = useRef(null);

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Defined once, stored in ref — reads latest answers/questions via refs,
  // uses submitAttempt (stable store action), no circular deps.
  const handleAutoSubmit = useCallback(async () => {
    if (autoSubmittedRef.current) return; // guard: never fire twice
    autoSubmittedRef.current = true;
    clearInterval(timerRef.current);

    if (!attemptIdRef.current) return;

    const payload = questionsRef.current.map((q) => ({
      question_id: q.id,
      selected_answer: answersRef.current[q.id] || 'X',
    }));

    try {
      // BUG from last fix: was raw api.post — now correctly uses store action
      // so auto-submit and manual submit share the same code path
      await submitAttempt(attemptIdRef.current, payload);
    } catch {
      // navigate to result regardless; score is whatever the server saved
    }

    clearProgress(assignmentId);
    navigate(`/student/result/${attemptIdRef.current}`);
  }, [submitAttempt, navigate, assignmentId, clearProgress]);

  // Keep the ref in sync with the latest version of handleAutoSubmit
  useEffect(() => {
    handleAutoSubmitRef.current = handleAutoSubmit;
  }, [handleAutoSubmit]);

  // startTimerInterval calls handleAutoSubmitRef.current (always latest),
  // so it never needs handleAutoSubmit in its own dep array — cycle broken.
  const startTimerInterval = useCallback(() => {
    // Always clear first so restore-path never spawns a second interval
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const current = getProgress(assignmentId);
      if (!current || current.timeLeft === null || current.timeLeft === undefined) return;

      if (current.timeLeft <= 1) {
        clearInterval(timerRef.current);
        updateTimeLeft(assignmentId, 0);
        setLocalData((prev) => prev ? { ...prev, timeLeft: 0 } : prev);
        handleAutoSubmitRef.current?.(); // call via ref — always the latest version
        return;
      }

      const newTime = current.timeLeft - 1;
      updateTimeLeft(assignmentId, newTime);
      setLocalData((prev) => prev ? { ...prev, timeLeft: newTime } : prev);
    }, 1000);
  }, [assignmentId, getProgress, updateTimeLeft]); // no handleAutoSubmit dep needed

  // Keep the ref in sync
  useEffect(() => {
    startTimerIntervalRef.current = startTimerInterval;
  }, [startTimerInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    initQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  // BUG D FIX cont.: initQuiz calls startTimerIntervalRef.current so it always
  // gets the latest startTimerInterval without needing it in its dep array.
  const initQuiz = useCallback(async () => {
    setInitLoading(true);
    autoSubmittedRef.current = false;

    const existing = getProgress(assignmentId);

    if (existing) {
      setLocalData(existing);
      questionsRef.current = existing.questions;
      answersRef.current = existing.answers;
      attemptIdRef.current = existing.attemptId;

      if (existing.timeLeft !== null && existing.timeLeft !== undefined && existing.timeLeft > 0) {
        startTimerIntervalRef.current?.();
      }

      setInitLoading(false);
      return;
    }

    try {
      const result = await startAttempt(Number(assignmentId));
      if (!result.success) {
        setError('Failed to start quiz: ' + result.error);
        setInitLoading(false);
        return;
      }

      const aId = result.attemptId;
      attemptIdRef.current = aId;

      const assignRes = await api.get(`/quiz-assignments/student/${user.id}`);
      const assignment = assignRes.data.find((a) => a.assignment_id === Number(assignmentId));
      if (!assignment) {
        setError('Assignment not found');
        setInitLoading(false);
        return;
      }

      if (assignment.submitted && assignment.attempt_id) {
        navigate(`/student/result/${assignment.attempt_id}`);
        return;
      }

      const quizRes = await api.get(`/quizzes/${assignment.quiz_id}`);
      const quizData = quizRes.data;

      const qRes = await api.get(`/questions/quiz/${assignment.quiz_id}`);
      const approved = qRes.data.filter((q) => q.status === 'APPROVED');

      const timeLimitSeconds = quizData.time_limit_minutes
        ? quizData.time_limit_minutes * 60
        : null;

      const initial = {
        attemptId: aId,
        questions: approved,
        answers: {},
        quizName: assignment.quiz_name,
        timeLimit: timeLimitSeconds,
        timeLeft: timeLimitSeconds,
      };

      initProgress(assignmentId, initial);
      setLocalData(initial);
      questionsRef.current = approved;
      answersRef.current = {};

      if (timeLimitSeconds) {
        startTimerIntervalRef.current?.();
      }

    } catch {
      setError('Something went wrong loading the quiz');
    }

    setInitLoading(false);
  // assignmentId is the only real dependency; store functions are stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const handleSelectAnswer = (questionId, answer) => {
    updateAnswer(assignmentId, questionId, answer);
    answersRef.current = { ...answersRef.current, [questionId]: answer };
    setLocalData((prev) => prev
      ? { ...prev, answers: { ...prev.answers, [questionId]: answer } }
      : prev
    );
  };

  const handleSubmit = async () => {
    const unanswered = localData.questions.filter((q) => !localData.answers[q.id]);
    if (unanswered.length > 0) {
      if (!window.confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    const payload = localData.questions.map((q) => ({
      question_id: q.id,
      selected_answer: localData.answers[q.id] || 'X',
    }));

    setSubmitting(true);
    const result = await submitAttempt(localData.attemptId, payload);
    setSubmitting(false);

    if (result.success) {
      clearProgress(assignmentId);
      navigate(`/student/result/${localData.attemptId}`);
    } else {
      setError(result.error);
    }
  };

  const getTimerColor = () => {
    if (!localData?.timeLeft || !localData?.timeLimit) return '#4f46e5';
    const pct = localData.timeLeft / localData.timeLimit;
    if (pct > 0.5) return '#059669';
    if (pct > 0.25) return '#d97706';
    return '#dc2626';
  };

  if (initLoading || !localData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="page-container">
        <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>
        <Button sx={{ mt: 2, textTransform: 'none' }} onClick={() => navigate('/student/quizzes')}>
          ← Back to Quizzes
        </Button>
      </Box>
    );
  }

  const { questions, answers, quizName, timeLeft, timeLimit } = localData;
  const timerColor = getTimerColor();
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const hasTimer = timeLimit !== null && timeLimit !== undefined;

  return (
    <Box className="page-container">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography className="page-title">{quizName}</Typography>

          {hasTimer && timeLeft !== null && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 2.5, py: 1, borderRadius: '10px',
              border: `2px solid ${timerColor}`,
              backgroundColor: timerColor + '15',
              minWidth: 130, justifyContent: 'center',
            }}>
              <TimerIcon sx={{ color: timerColor, fontSize: 20 }} />
              <Typography sx={{
                fontSize: 24, fontWeight: 800, color: timerColor,
                fontFamily: 'monospace', letterSpacing: 2,
              }}>
                {formatTime(timeLeft)}
              </Typography>
            </Box>
          )}
        </Box>

        {hasTimer && timeLeft !== null && timeLeft <= 120 && timeLeft > 0 && (
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 1.5, borderRadius: '8px' }}>
            ⚠️ Less than {timeLeft <= 60 ? '1 minute' : '2 minutes'} remaining! Your quiz will auto-submit when the timer reaches 0.
          </Alert>
        )}

        {hasTimer && timeLeft === 0 && (
          <Alert severity="error" sx={{ mt: 1.5, borderRadius: '8px' }}>
            ⏰ Time is up! Submitting your quiz automatically...
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
          <Typography sx={{ fontSize: 13, color: '#64748b' }}>
            {answeredCount} of {questions.length} answered
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#64748b' }}>
            {questions.length - answeredCount} remaining
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, borderRadius: '4px', height: 6 }} />
      </Box>

      {/* Questions */}
      <Box className="quiz-attempt-container">
        {questions.map((q, idx) => (
          <Box key={q.id} className="question-card">
            <Typography className="question-number">
              Question {idx + 1} of {questions.length}
            </Typography>
            <Typography className="question-text">{q.question_text}</Typography>

            <div className="options-list">
              {[
                { label: 'A', value: 'A', text: q.option_a },
                { label: 'B', value: 'B', text: q.option_b },
                { label: 'C', value: 'C', text: q.option_c },
                { label: 'D', value: 'D', text: q.option_d },
              ]
                .filter((opt) => opt.text)
                .map((opt) => (
                  <button
                    key={opt.value}
                    className={`option-btn ${answers[q.id] === opt.value ? 'selected' : ''}`}
                    onClick={() => handleSelectAnswer(q.id, opt.value)}
                  >
                    <span className="option-label">{opt.label}</span>
                    <span>{opt.text}</span>
                  </button>
                ))}
            </div>
          </Box>
        ))}

        {questions.length === 0 && (
          <Alert severity="warning">No approved questions found for this quiz.</Alert>
        )}

        {questions.length > 0 && (
          <Paper sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontSize: 14, color: '#64748b' }}>
                  {answeredCount}/{questions.length} questions answered
                </Typography>
                {hasTimer && timeLeft > 0 && (
                  <Typography sx={{ fontSize: 12, color: timerColor, fontWeight: 600, mt: 0.3 }}>
                    ⏱ {formatTime(timeLeft)} remaining
                  </Typography>
                )}
              </Box>
              <Button
                variant="contained"
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                onClick={handleSubmit}
                disabled={submitting || loading || timeLeft === 0}
                sx={{
                  textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 4,
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
