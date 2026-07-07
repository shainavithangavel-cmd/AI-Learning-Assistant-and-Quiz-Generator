import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Alert, CircularProgress,
  Paper, Checkbox, FormControlLabel, Chip, Table,
  TableBody, TableCell, TableHead, TableRow, TableContainer
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import useQuizStore from '../stores/useQuizStore';
import useUserStore from '../stores/useUserStore';

export default function AssignQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { currentQuiz, fetchQuiz, assignQuiz, fetchAssignmentsForQuiz, assignments } = useQuizStore();
  const { users, fetchUsers } = useUserStore();

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [alert, setAlert] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuiz(quizId);
    fetchUsers();
    fetchAssignmentsForQuiz(quizId);
  }, [quizId]);

  const students = users.filter((u) => u.role === 'STUDENT');

  // Students already assigned
  const assignedIds = assignments.map((a) => a.student_id);

  const toggleStudent = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const unassigned = students.filter((s) => !assignedIds.includes(s.id)).map((s) => s.id);
    setSelectedStudents(selectedStudents.length === unassigned.length ? [] : unassigned);
  };

  const handleAssign = async () => {
    if (selectedStudents.length === 0) {
      setAlert({ type: 'error', msg: 'Select at least one student' });
      return;
    }
    setLoading(true);
    const result = await assignQuiz(quizId, selectedStudents);
    setLoading(false);
    if (result.success) {
      setSelectedStudents([]);
      fetchAssignmentsForQuiz(quizId);
      setAlert({ type: 'success', msg: result.data.message });
    } else {
      setAlert({ type: 'error', msg: result.error });
    }
    setTimeout(() => setAlert({ type: '', msg: '' }), 3000);
  };

  const unassignedStudents = students.filter((s) => !assignedIds.includes(s.id));

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box>
          <Typography className="page-title">Assign Quiz</Typography>
          <Typography className="page-subtitle">
            {currentQuiz?.quiz_name} — Select students to assign this quiz
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => navigate(`/trainer/questions/${quizId}`)}
          sx={{ textTransform: 'none', borderRadius: '8px' }}
        >
          ← Back to Questions
        </Button>
      </Box>

      {alert.msg && (
        <Alert severity={alert.type} sx={{ mb: 2, borderRadius: '8px' }}>{alert.msg}</Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {/* Available students */}
        <Paper sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
              Available Students ({unassignedStudents.length})
            </Typography>
            <Button size="small" onClick={handleSelectAll} sx={{ textTransform: 'none', fontSize: 12 }}>
              {selectedStudents.length === unassignedStudents.length && unassignedStudents.length > 0
                ? 'Deselect All' : 'Select All'}
            </Button>
          </Box>
          <Box sx={{ p: 1.5 }}>
            {unassignedStudents.length === 0 && (
              <Typography sx={{ color: '#94a3b8', textAlign: 'center', py: 3, fontSize: 13 }}>
                All students are already assigned
              </Typography>
            )}
            {unassignedStudents.map((s) => (
              <Box
                key={s.id}
                onClick={() => toggleStudent(s.id)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, p: 1.2,
                  borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: selectedStudents.includes(s.id) ? '#f0f4ff' : 'transparent',
                  '&:hover': { background: '#f8fafc' },
                  border: selectedStudents.includes(s.id) ? '1px solid #4f46e5' : '1px solid transparent',
                  mb: 0.5,
                }}
              >
                <Checkbox
                  checked={selectedStudents.includes(s.id)}
                  size="small"
                  color="primary"
                  onChange={() => {}}
                />
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{s.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#64748b' }}>{s.email}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
          {unassignedStudents.length > 0 && (
            <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
              <Button
                variant="contained" fullWidth
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AssignmentTurnedInIcon />}
                onClick={handleAssign} disabled={loading || selectedStudents.length === 0}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                Assign to {selectedStudents.length > 0 ? `${selectedStudents.length} Student(s)` : 'Students'}
              </Button>
            </Box>
          )}
        </Paper>

        {/* Already assigned */}
        <Paper sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
              Already Assigned ({assignments.length})
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: '#f8fafc' }}>
                  <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Student</TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Status</TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#94a3b8', fontSize: 13 }}>
                      No assignments yet
                    </TableCell>
                  </TableRow>
                )}
                {assignments.map((a) => (
                  <TableRow key={a.assignment_id} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{a.student_name}</Typography>
                      <Typography sx={{ fontSize: 11, color: '#64748b' }}>{a.student_email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={a.submitted ? 'Submitted' : 'Pending'}
                        size="small"
                        color={a.submitted ? 'success' : 'default'}
                        sx={{ fontSize: 10 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {a.submitted ? `${a.score}%` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}
