import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BarChartIcon from '@mui/icons-material/BarChart';
import useAuthStore from '../stores/useAuthStore';
import useAttemptStore from '../stores/useAttemptStore';
import StatusBadge from '../components/StatusBadge';

export default function AssignedQuizzesPage() {
  const { user } = useAuthStore();
  const { assignments, fetchAssignments } = useAttemptStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchAssignments(user.id);
  }, [user]);

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box>
          <Typography className="page-title">My Quizzes</Typography>
          <Typography className="page-subtitle">All quizzes assigned to you</Typography>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #e2e8f0' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
              {['#', 'Quiz Name', 'Difficulty', 'Assigned On', 'Status', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                  No quizzes assigned yet
                </TableCell>
              </TableRow>
            )}
            {assignments.map((a, idx) => (
              <TableRow key={a.assignment_id} hover>
                <TableCell sx={{ fontSize: 13, color: '#94a3b8' }}>{idx + 1}</TableCell>
                <TableCell sx={{ fontSize: 14, fontWeight: 500 }}>{a.quiz_name}</TableCell>
                <TableCell><StatusBadge status={a.difficulty} /></TableCell>
                <TableCell sx={{ fontSize: 12, color: '#64748b' }}>
                  {new Date(a.assigned_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={a.submitted ? 'Submitted' : a.attempted ? 'In Progress' : 'Not Started'}
                    size="small"
                    color={a.submitted ? 'success' : a.attempted ? 'warning' : 'default'}
                    sx={{ fontSize: 11 }}
                  />
                </TableCell>
                <TableCell>
                  {a.submitted && a.attempt_id ? (
                    <Button
                      size="small" variant="outlined" startIcon={<BarChartIcon />}
                      onClick={() => navigate(`/student/result/${a.attempt_id}`)}
                      sx={{ textTransform: 'none', fontSize: 12, borderRadius: '6px' }}
                    >
                      View Result
                    </Button>
                  ) : (
                    <Button
                      size="small" variant="contained" startIcon={<PlayArrowIcon />}
                      onClick={() => navigate(`/student/attempt/${a.assignment_id}`)}
                      sx={{ textTransform: 'none', fontSize: 12, borderRadius: '6px' }}
                    >
                      {a.attempted ? 'Continue' : 'Start Quiz'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
