import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Button } from '@mui/material';
import TopicIcon from '@mui/icons-material/LibraryBooks';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import DashboardCard from '../components/DashboardCard';
import useAuthStore from '../stores/useAuthStore';
import useQuizStore from '../stores/useQuizStore';
import useTopicStore from '../stores/useTopicStore';
import StatusBadge from '../components/StatusBadge';

export default function TrainerDashboard() {
  const { user } = useAuthStore();
  const { quizzes, fetchQuizzes } = useQuizStore();
  const { topics, fetchTopics } = useTopicStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
    fetchTopics();
  }, []);

  const published = quizzes.filter((q) => q.published_at).length;
  const draft = quizzes.filter((q) => !q.published_at).length;
  const recentQuizzes = [...quizzes]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box>
          <Typography className="page-title">Trainer Dashboard</Typography>
          <Typography className="page-subtitle">Welcome back, {user?.name}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined" startIcon={<AddIcon />}
            onClick={() => navigate('/trainer/topics')}
            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
          >
            Add Topic
          </Button>
          <Button
            variant="contained" startIcon={<QuizIcon />}
            onClick={() => navigate('/trainer/create-quiz')}
            sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
          >
            Create Quiz
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Total Topics" value={topics.length} icon={<TopicIcon />} color="#0891b2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Total Quizzes" value={quizzes.length} icon={<QuizIcon />} color="#4f46e5" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Published" value={published} icon={<CheckCircleIcon />} color="#059669" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Drafts" value={draft} icon={<QuizIcon />} color="#f59e0b" />
        </Grid>
      </Grid>

      {/* Recent quizzes table */}
      <Box className="section-card">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 15 }}>Recent Quizzes</Typography>
          <Button
            size="small" sx={{ textTransform: 'none', fontSize: 13 }}
            onClick={() => navigate('/trainer/quizzes')}
          >
            View All
          </Button>
        </Box>
        {recentQuizzes.map((q) => (
          <Box
            key={q.id}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              py: 1.2, borderBottom: '1px solid #f1f5f9',
              '&:last-child': { borderBottom: 'none' },
              cursor: 'pointer', '&:hover': { backgroundColor: '#f8fafc' },
              borderRadius: '6px', px: 1,
            }}
            onClick={() => navigate(`/trainer/questions/${q.id}`)}
          >
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{q.quiz_name}</Typography>
              <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                {q.question_count} questions
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <StatusBadge status={q.difficulty} />
              <StatusBadge status={q.published_at ? 'PUBLISHED' : 'DRAFT'} />
            </Box>
          </Box>
        ))}
        {recentQuizzes.length === 0 && (
          <Typography sx={{ color: '#94a3b8', textAlign: 'center', py: 3, fontSize: 14 }}>
            No quizzes yet. Create your first quiz!
          </Typography>
        )}
      </Box>
    </Box>
  );
}
