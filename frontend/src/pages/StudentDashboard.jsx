import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Button, Chip } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import useAuthStore from '../stores/useAuthStore';
import useAttemptStore from '../stores/useAttemptStore';
import DashboardCard from '../components/DashboardCard';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { assignments, fetchAssignments } = useAttemptStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchAssignments(user.id); //only fetch the assignments after user data is available
  }, [user]); //dependency array telling to run this function again when user changes

  const submitted = assignments.filter((a) => a.submitted).length;
  const pending = assignments.filter((a) => !a.submitted).length;

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box>
          <Typography className="page-title">Student Dashboard</Typography>
          <Typography className="page-subtitle">Welcome back, {user?.name}! Here are your assigned quizzes.</Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/student/quizzes')}
          sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
        >
          View My Quizzes
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <DashboardCard title="Total Assigned" value={assignments.length} icon={<AssignmentIcon />} color="#4f46e5" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DashboardCard title="Submitted" value={submitted} icon={<CheckCircleIcon />} color="#059669" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DashboardCard title="Pending" value={pending} icon={<HourglassEmptyIcon />} color="#f59e0b" />
        </Grid>
      </Grid>

      {/* Recent quizzes */}
      <Box className="section-card">
        <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 15 }}>Recent Quiz Assignments</Typography>
        {assignments.slice(0, 5).map((a) => (
          <Box
            key={a.assignment_id}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              py: 1.5, borderBottom: '1px solid #f1f5f9',
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{a.quiz_name}</Typography>
              <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                Difficulty: {a.difficulty}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={a.submitted ? 'Submitted' : 'Pending'}
                size="small"
                color={a.submitted ? 'success' : 'warning'}
              />
              {a.submitted && a.attempt_id ? (
                <Button
                  size="small" variant="outlined"
                  onClick={() => navigate(`/student/result/${a.attempt_id}`)}
                  sx={{ textTransform: 'none', fontSize: 12, borderRadius: '6px' }}
                >
                  View Result
                </Button>
              ) : (
                <Button
                  size="small" variant="contained"
                  onClick={() => navigate(`/student/attempt/${a.assignment_id}`)}
                  sx={{ textTransform: 'none', fontSize: 12, borderRadius: '6px' }}
                >
                  Start Quiz
                </Button>
              )}
            </Box>
          </Box>
        ))}
        {assignments.length === 0 && (
          <Typography sx={{ color: '#94a3b8', textAlign: 'center', py: 3, fontSize: 14 }}>
            No quizzes assigned yet. Check back later!
          </Typography>
        )}
      </Box>
    </Box>
  );
}
