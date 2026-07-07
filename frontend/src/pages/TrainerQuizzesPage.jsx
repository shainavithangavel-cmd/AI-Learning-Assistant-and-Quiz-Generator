import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Tooltip, Alert, Collapse, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, Divider, Grid
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import useQuizStore from '../stores/useQuizStore';
import StatusBadge from '../components/StatusBadge';
import api from '../api/axios';

// dialog showing one student's full answer breakdown
function StudentDetailDialog({ open, onClose, attemptId, studentName }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !attemptId) return; //if not open do not call api
    setLoading(true);
    api.get(`/quiz-attempts/${attemptId}/result/trainer-view`)
      .then((res) => setDetail(res.data))
      .catch(() => setDetail(null)) //before api response its value is null
      .finally(() => setLoading(false));
  }, [open, attemptId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
        {studentName}'s Attempt
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading && detail && (
          <Box>
            {/* score summary */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 1 }}>
              <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: '8px', backgroundColor: '#f0f4ff' }}>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#4f46e5' }}>{detail.score}%</Typography>
                <Typography sx={{ fontSize: 11, color: '#64748b' }}>Score</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: '8px', backgroundColor: '#f0fdf4' }}>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>{detail.correct_count}</Typography>
                <Typography sx={{ fontSize: 11, color: '#64748b' }}>Correct</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, borderRadius: '8px', backgroundColor: '#fff5f5' }}>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{detail.wrong_count}</Typography>
                <Typography sx={{ fontSize: 11, color: '#64748b' }}>Wrong</Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography sx={{ fontWeight: 600, fontSize: 13, mb: 1.5, color: '#475569' }}>
              Answer Breakdown
            </Typography>

            {detail.answers.map((ans, idx) => (
              <Box
                key={ans.question_id}
                sx={{
                  borderRadius: '8px', p: 1.5, mb: 1.2,
                  border: `1px solid ${ans.is_correct ? '#bbf7d0' : '#fecaca'}`,
                  backgroundColor: ans.is_correct ? '#f0fdf4' : '#fff5f5',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 0.5 }}>
                  {ans.is_correct
                    ? <CheckCircleIcon sx={{ color: '#059669', fontSize: 16, mt: 0.2 }} />
                    : <CancelIcon sx={{ color: '#dc2626', fontSize: 16, mt: 0.2 }} />
                  }
                  <Typography sx={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
                    Q{idx + 1}. {ans.question_text}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: 3 }}>
                  <Chip
                    label={`Student answered: ${ans.selected_answer || 'Not answered'}`}
                    size="small"
                    color={ans.is_correct ? 'success' : 'error'}
                    variant="outlined"
                    sx={{ fontSize: 10 }}
                  />
                  {!ans.is_correct && (
                    <Chip
                      label={`Correct: ${ans.correct_answer}`}
                      size="small" color="success" variant="outlined"
                      sx={{ fontSize: 10 }}
                    />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {!loading && !detail && (
          <Typography sx={{ textAlign: 'center', py: 3, color: '#94a3b8', fontSize: 13 }}>
            Could not load attempt details
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

// student attempts table inside expanded quiz row
function StudentAttemptsRow({ quizId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailDialog, setDetailDialog] = useState({ open: false, attemptId: null, name: '' });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get(`/quiz-assignments/quiz/${quizId}`);
        setStudents(res.data);
      } catch (err) {
        console.error('failed to load students', err);
      }
      setLoading(false);
    };
    fetchStudents();
  }, [quizId]);

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (students.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
          No students assigned yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, backgroundColor: '#f8fafc' }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#475569', mb: 1.5 }}>
        <PeopleIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
        Student Attempts ({students.length} assigned)
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9' }}>Student</TableCell>
            <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9' }}>Email</TableCell>
            <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9' }}>Status</TableCell>
            <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9' }}>Score</TableCell>
            <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9' }}>Assigned On</TableCell>
            <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9' }}>Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s.assignment_id} hover>
              <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{s.student_name}</TableCell>
              <TableCell sx={{ fontSize: 12, color: '#64748b' }}>{s.student_email}</TableCell>
              <TableCell>
                <Chip
                  label={s.submitted ? 'Submitted' : 'Not Attempted'}
                  size="small"
                  color={s.submitted ? 'success' : 'default'}
                  sx={{ fontSize: 10, fontWeight: 600 }}
                />
              </TableCell>
              <TableCell>
                {s.submitted ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      sx={{
                        fontSize: 13, fontWeight: 700,
                        color: s.score >= 80 ? '#059669' : s.score >= 50 ? '#d97706' : '#dc2626',
                      }}
                    >
                      {s.score}%
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                      ({s.total_questions}Q)
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>—</Typography>
                )}
              </TableCell>
              <TableCell sx={{ fontSize: 12, color: '#94a3b8' }}>
                {new Date(s.assigned_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {s.submitted ? (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                    onClick={() => setDetailDialog({ open: true, attemptId: s.attempt_id, name: s.student_name })}
                    sx={{ textTransform: 'none', fontSize: 12 }}
                  >
                    View Answers
                  </Button>
                ) : (
                  <Typography sx={{ fontSize: 11, color: '#cbd5e1' }}>—</Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <StudentDetailDialog
        open={detailDialog.open}
        attemptId={detailDialog.attemptId}
        studentName={detailDialog.name}
        onClose={() => setDetailDialog({ open: false, attemptId: null, name: '' })}
      />
    </Box>
  );
}

function QuizRow({ quiz, index, onDelete, navigate }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ fontSize: 13, color: '#94a3b8' }}>{index + 1}</TableCell>
        <TableCell sx={{ fontSize: 14, fontWeight: 500 }}>{quiz.quiz_name}</TableCell>
        <TableCell><StatusBadge status={quiz.difficulty} /></TableCell>
        <TableCell sx={{ fontSize: 13 }}>{quiz.question_count}</TableCell>
        <TableCell>
          <StatusBadge status={quiz.published_at ? 'PUBLISHED' : 'DRAFT'} />
        </TableCell>
        <TableCell sx={{ fontSize: 12, color: '#94a3b8' }}>
          {new Date(quiz.created_at).toLocaleDateString()}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {quiz.published_at && (
              <Tooltip title={expanded ? 'Hide Students' : 'View Student Attempts'}>
                <IconButton
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  sx={{ color: expanded ? '#4f46e5' : '#64748b' }}
                >
                  {expanded
                    ? <KeyboardArrowUpIcon fontSize="small" />
                    : <KeyboardArrowDownIcon fontSize="small" />
                  }
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Review Questions">
              <IconButton size="small" onClick={() => navigate(`/trainer/questions/${quiz.id}`)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {quiz.published_at && (
              <Tooltip title="Assign to Students">
                <IconButton size="small" color="primary" onClick={() => navigate(`/trainer/assign/${quiz.id}`)}>
                  <AssignmentIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete Quiz">
              <IconButton size="small" color="error" onClick={() => onDelete(quiz.id, quiz.quiz_name)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>

      {quiz.published_at && (
        <TableRow>
          <TableCell colSpan={7} sx={{ p: 0, border: expanded ? undefined : 'none' }}>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <StudentAttemptsRow quizId={quiz.id} />
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function TrainerQuizzesPage() {
  const { quizzes, fetchQuizzes, deleteQuiz } = useQuizStore();
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This will also delete all questions and assignments.`
    );
    if (!confirmed) return;

    const result = await deleteQuiz(id);
    if (result.success) {
      setSuccessMsg('Quiz deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg(result.error);
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box>
          <Typography className="page-title">My Quizzes</Typography>
          <Typography className="page-subtitle">
            View, manage quizzes and track student attempts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/trainer/create-quiz')}
          sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
        >
          Create Quiz
        </Button>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>{successMsg}</Alert>
      )}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{errorMsg}</Alert>
      )}

      <TableContainer
        component={Paper}
        sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #e2e8f0' }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
              {['#', 'Quiz Name', 'Difficulty', 'Questions', 'Status', 'Created', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {quizzes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                  No quizzes yet. Create your first one!
                </TableCell>
              </TableRow>
            )}
            {quizzes.map((q, i) => (
              <QuizRow
                key={q.id}
                quiz={q}
                index={i}
                onDelete={handleDelete}
                navigate={navigate}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ fontSize: 12, color: '#94a3b8', mt: 1.5, mb: 3 }}>
        💡 Click the arrow icon on published quizzes to see student attempt details, then click "View Answers" to see exactly which questions a student got right or wrong
      </Typography>

      {/* Summary Stats Card */}
      {quizzes.length > 0 && (
        <Paper
          sx={{
            borderRadius: '12px', border: '1px solid #e2e8f0',
            boxShadow: 'none', p: 2.5,
            background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%)',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 2, color: '#475569' }}>
            📊 Quiz Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1.5, background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>
                  {quizzes.length}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#64748b' }}>Total Quizzes</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1.5, background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>
                  {quizzes.filter((q) => q.published_at).length}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#64748b' }}>Published</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1.5, background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
                  {quizzes.filter((q) => !q.published_at).length}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#64748b' }}>Drafts</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1.5, background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#0891b2' }}>
                  {quizzes.reduce((sum, q) => sum + q.question_count, 0)}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#64748b' }}>Total Questions</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}