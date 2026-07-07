import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert,
  CircularProgress, Paper, LinearProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import PublishIcon from '@mui/icons-material/Publish';
import AssignmentIcon from '@mui/icons-material/Assignment';
import useQuestionStore from '../stores/useQuestionStore';
import useQuizStore from '../stores/useQuizStore';
import StatusBadge from '../components/StatusBadge';

export default function QuestionReviewPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const {
    questions, loading,
    fetchQuestions, approveQuestion, rejectQuestion,
    editQuestion, regenerateQuestion
  } = useQuestionStore();
  const { currentQuiz, fetchQuiz, publishQuiz } = useQuizStore();

  // edit dialog state
  const [editDialog, setEditDialog] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});

  // reject confirm popup state
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  const [alert, setAlert] = useState({ type: '', msg: '' });
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchQuestions(quizId);
    fetchQuiz(quizId);
  }, [quizId]);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert({ type: '', msg: '' }), 3000);
  };

  const handleApprove = async (id) => {
    const r = await approveQuestion(id);
    if (!r.success) showAlert('error', r.error);
    else showAlert('success', 'Question approved!');
  };

  // open reject popup
  const openRejectDialog = (question) => {
    setRejectTarget(question);
    setRejectDialog(true);
  };

  // just reject without regenerating
  const handleRejectOnly = async () => {
    const r = await rejectQuestion(rejectTarget.id);
    setRejectDialog(false);
    setRejectTarget(null);
    if (!r.success) showAlert('error', r.error);
    else showAlert('info', 'Question rejected');
  };

  // reject and regenerate
  const handleRejectAndRegenerate = async () => {
    setRegenerating(true);
    showAlert('info', 'Regenerating question with AI...');

    // first reject the old one
    await rejectQuestion(rejectTarget.id);

    // then regenerate
    const r = await regenerateQuestion(rejectTarget.id);
    setRegenerating(false);
    setRejectDialog(false);
    setRejectTarget(null);

    if (!r.success) showAlert('error', r.error);
    else showAlert('success', 'New question generated!');
  };

  const openEdit = (q) => {
    setEditTarget(q);
    setEditForm({
      question_text: q.question_text,
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
    });
    setEditDialog(true);
  };

  const handleEditSave = async () => {
    const r = await editQuestion(editTarget.id, editForm);
    if (r.success) {
      setEditDialog(false);
      showAlert('success', 'Question updated!');
    } else {
      showAlert('error', r.error);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    const r = await publishQuiz(quizId);
    setPublishing(false);
    if (r.success) showAlert('success', 'Quiz published successfully!');
    else showAlert('error', r.error);
  };

  // only show non-rejected questions in the main list
  // rejected ones are hidden to keep the list clean
  const visibleQuestions = questions.filter((q) => q.status !== 'REJECTED');
  const approved = questions.filter((q) => q.status === 'APPROVED').length;
  const total = visibleQuestions.length;
  const isPublished = !!currentQuiz?.published_at;

  return (
    <Box className="page-container">
      {/* Header */}
      <Box className="page-header">
        <Box>
          <Typography className="page-title">
            Question Review {currentQuiz && `— ${currentQuiz.quiz_name}`}
          </Typography>
          <Typography className="page-subtitle">
            Approve or reject questions. Click Reject to get regeneration option.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate(`/trainer/assign/${quizId}`)}
            disabled={!currentQuiz?.published_at}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            Assign to Students
          </Button>
          <Button
            variant="contained"
            startIcon={publishing
              ? <CircularProgress size={16} color="inherit" />
              : <PublishIcon />
            }
            onClick={handlePublish}
            disabled={publishing || !!currentQuiz?.published_at || approved === 0}
            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
          >
            {isPublished ? 'Published ✓' : 'Publish Quiz'}
          </Button>
        </Box>
      </Box>

      {alert.msg && (
        <Alert severity={alert.type || 'info'} sx={{ mb: 2, borderRadius: '8px' }}>
          {alert.msg}
        </Alert>
      )}

      {/* Progress bar */}
      <Paper sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            {approved} of {total} questions approved
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['GENERATED', 'APPROVED', 'REJECTED'].map((s) => (
              <Chip
                key={s} size="small"
                label={`${s}: ${questions.filter((q) => q.status === s).length}`}
                color={s === 'APPROVED' ? 'success' : s === 'REJECTED' ? 'error' : 'warning'}
                variant="outlined"
                sx={{ fontSize: 11 }}
              />
            ))}
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={total > 0 ? (approved / total) * 100 : 0}
          sx={{ borderRadius: '4px', height: 6 }}
        />
      </Paper>

      {loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && visibleQuestions.length === 0 && (
        <Box className="empty-state">
          <Typography sx={{ fontSize: 40 }}>🤖</Typography>
          <Typography sx={{ fontWeight: 600, mt: 1 }}>No questions yet</Typography>
          <Typography sx={{ fontSize: 13, mt: 0.5 }}>
            Go back and generate questions with AI
          </Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2, textTransform: 'none', borderRadius: '8px' }}
            onClick={() => navigate('/trainer/create-quiz')}
          >
            Create Quiz
          </Button>
        </Box>
      )}

      {/* Question Cards */}
      {visibleQuestions.map((q, idx) => (
        <Paper
          key={q.id}
          sx={{
            borderRadius: '12px', border: '1px solid #e2e8f0',
            boxShadow: 'none', mb: 2, overflow: 'hidden',
            borderLeft: `4px solid ${q.status === 'APPROVED' ? '#10b981' : '#f59e0b'}`,
          }}
        >
          <Box sx={{ p: 2.5 }}>
            {/* Question header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>
                  Q{idx + 1}
                </Typography>
                <StatusBadge status={q.status} />
                <Chip
                  label={q.question_type} size="small"
                  variant="outlined" sx={{ fontSize: 10 }}
                />
                {q.edited_by_trainer && (
                  <Chip
                    label="Edited" size="small"
                    sx={{ fontSize: 10, background: '#ede9fe', color: '#5b21b6' }}
                  />
                )}
                {q.regenerated_from && (
                  <Chip
                    label="Regenerated" size="small"
                    sx={{ fontSize: 10, background: '#fef3c7', color: '#92400e' }}
                  />
                )}
              </Box>
              {q.confidence_score && (
                <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                  AI confidence: {Math.round(q.confidence_score * 100)}%
                </Typography>
              )}
            </Box>

            {/* Question text */}
            <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 1.5, lineHeight: 1.5 }}>
              {q.question_text}
            </Typography>

            {/* Options */}
            {q.option_a && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.5 }}>
                {['a', 'b', 'c', 'd'].map((opt) => q[`option_${opt}`] && (
                  <Box
                    key={opt}
                    sx={{
                      display: 'flex', gap: 1, alignItems: 'flex-start',
                      p: 1, borderRadius: '6px',
                      background: q.correct_answer === opt.toUpperCase() ? '#d1fae5' : '#f8fafc',
                      border: `1px solid ${q.correct_answer === opt.toUpperCase() ? '#10b981' : '#e2e8f0'}`,
                    }}
                  >
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', minWidth: 16 }}>
                      {opt.toUpperCase()}.
                    </Typography>
                    <Typography sx={{ fontSize: 13 }}>{q[`option_${opt}`]}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Explanation */}
            {q.explanation && (
              <Box sx={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', p: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#0369a1', mb: 0.5 }}>
                  EXPLANATION
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#0c4a6e' }}>
                  {q.explanation}
                </Typography>
              </Box>
            )}

            {/* Action buttons - NO standalone regenerate button */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {q.status !== 'APPROVED' && (
                <Button
                  size="small" variant="contained" color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleApprove(q.id)}
                  sx={{ textTransform: 'none', fontSize: 12, borderRadius: '6px' }}
                >
                  Approve
                </Button>
              )}
              {q.status !== 'REJECTED' && (
                <Button
                  size="small" variant="outlined" color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => openRejectDialog(q)}
                  sx={{ textTransform: 'none', fontSize: 12, borderRadius: '6px' }}
                >
                  Reject
                </Button>
              )}
              <Button
                size="small" variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => openEdit(q)}
                sx={{ textTransform: 'none', fontSize: 12, borderRadius: '6px' }}
              >
                Edit
              </Button>
            </Box>
          </Box>
        </Paper>
      ))}

      {/* ── Reject Confirmation Popup ── */}
      <Dialog
        open={rejectDialog}
        onClose={() => { if (!regenerating) setRejectDialog(false); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Reject this question?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: '#475569', mb: 1 }}>
            "{rejectTarget?.question_text}"
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#64748b' }}>
            Do you want to just reject it, or reject and generate a new question with AI?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setRejectDialog(false)}
            disabled={regenerating}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRejectOnly}
            disabled={regenerating}
            color="error"
            variant="outlined"
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            Just Reject
          </Button>
          <Button
            onClick={handleRejectAndRegenerate}
            disabled={regenerating}
            variant="contained"
            color="warning"
            startIcon={regenerating
              ? <CircularProgress size={14} color="inherit" />
              : <RefreshIcon />
            }
            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
          >
            {regenerating ? 'Generating...' : 'Reject & Regenerate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Question</DialogTitle>
        <DialogContent>
          <TextField
            label="Question Text" value={editForm.question_text || ''}
            fullWidth multiline rows={2} size="small" sx={{ mb: 2, mt: 1 }}
            onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
          />
          <Box className="form-row" sx={{ mb: 2 }}>
            <TextField
              label="Option A" value={editForm.option_a || ''} fullWidth size="small"
              onChange={(e) => setEditForm({ ...editForm, option_a: e.target.value })}
            />
            <TextField
              label="Option B" value={editForm.option_b || ''} fullWidth size="small"
              onChange={(e) => setEditForm({ ...editForm, option_b: e.target.value })}
            />
          </Box>
          <Box className="form-row" sx={{ mb: 2 }}>
            <TextField
              label="Option C" value={editForm.option_c || ''} fullWidth size="small"
              onChange={(e) => setEditForm({ ...editForm, option_c: e.target.value })}
            />
            <TextField
              label="Option D" value={editForm.option_d || ''} fullWidth size="small"
              onChange={(e) => setEditForm({ ...editForm, option_d: e.target.value })}
            />
          </Box>
          <TextField
            label="Correct Answer (A/B/C/D)" value={editForm.correct_answer || ''}
            fullWidth size="small" sx={{ mb: 2 }}
            onChange={(e) => setEditForm({ ...editForm, correct_answer: e.target.value.toUpperCase() })}
            inputProps={{ maxLength: 1 }}
          />
          <TextField
            label="Explanation" value={editForm.explanation || ''}
            fullWidth multiline rows={3} size="small"
            onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained" onClick={handleEditSave}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
