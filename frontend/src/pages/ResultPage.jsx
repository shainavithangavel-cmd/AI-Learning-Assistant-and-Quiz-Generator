import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Paper,
  Chip, Grid, Divider, LinearProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HomeIcon from '@mui/icons-material/Home';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import useAttemptStore from '../stores/useAttemptStore';

function generateInsights(result) {
  const score = result.score;
  const wrongAnswers = result.answers.filter((a) => !a.is_correct);

  const weakTopics = wrongAnswers.slice(0, 3).map((a) => {
    const words = a.question_text.split(' ').slice(0, 6).join(' ');
    return `${words}...`;
  });

  let tips = [];
  if (score < 40) {
    tips = [
      'Go back and re-read the learning notes carefully',
      'Focus on understanding concepts before attempting again',
      'Try practicing with easier questions first',
      'Take notes while reading — it helps with retention',
    ];
  } else if (score < 60) {
    tips = [
      'Review the explanations for questions you got wrong',
      'Practice the weak topics identified below more',
      'Try to understand why the correct answer is right',
      'Attempt the quiz again after reviewing the notes',
    ];
  } else if (score < 80) {
    tips = [
      'Good effort! Focus on the few topics you missed',
      'Read the explanations for wrong answers carefully',
      'You are close to mastering this topic — keep going',
      'Try a harder difficulty quiz next time',
    ];
  } else {
    tips = [
      'Excellent work! You have a strong grasp of this topic',
      'Try the same topic at a harder difficulty level',
      'Move on to the next topic — you are ready',
      'Help others by explaining the concepts you learned',
    ];
  }

  let nextSteps = [];
  if (score < 60) {
    nextSteps = [
      'Re-attempt this quiz after reviewing notes',
      'Ask your trainer to explain the weak areas',
      'Try a True/False version of this quiz for basics',
    ];
  } else {
    nextSteps = [
      'Try a harder difficulty quiz on this topic',
      'Move on to the next topic in your learning path',
      'Try Short Answer questions to test deeper understanding',
    ];
  }

  return { weakTopics, tips, nextSteps };
}

export default function ResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { result, fetchResult, loading } = useAttemptStore();
  const [showAllAnswers, setShowAllAnswers] = useState(false);
//runs when page opens and attempt id changes
  useEffect(() => { 
    fetchResult(attemptId);
  }, [attemptId]);

  if (loading || !result) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const scoreColor =
    result.score >= 80 ? '#059669' :
    result.score >= 50 ? '#d97706' : '#dc2626';

  const scoreBg =
    result.score >= 80 ? '#d1fae5' :
    result.score >= 50 ? '#fef3c7' : '#fee2e2';

  const insights = generateInsights(result);
  const answersToShow = showAllAnswers ? result.answers : result.answers.slice(0, 3);

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Typography className="page-title">Quiz Result</Typography>
        <Button
          variant="outlined"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/student/quizzes')}
          sx={{ textTransform: 'none', borderRadius: '8px' }}
        >
          Back to Quizzes
        </Button>
      </Box>

      {/* Score Card */}
      <Paper
        sx={{
          borderRadius: '16px', p: 4, mb: 3,
          boxShadow: 'none', border: '1px solid #e2e8f0',
          background: `linear-gradient(135deg, ${scoreBg} 0%, white 100%)`,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 2, color: '#1e293b' }}>
          {result.quiz_name}
        </Typography>

        <Box
          sx={{
            width: 120, height: 120, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', margin: '0 auto 20px',
            background: scoreBg, border: `4px solid ${scoreColor}`,
          }}
        >
          <Typography sx={{ fontSize: 34, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
            {result.score}%
          </Typography>
          <Typography sx={{ fontSize: 10, color: scoreColor, fontWeight: 600 }}>
            SCORE
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#059669' }}>
              {result.correct_count}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#64748b' }}>Correct</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#dc2626' }}>
              {result.wrong_count}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#64748b' }}>Wrong</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#4f46e5' }}>
              {result.total_questions}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#64748b' }}>Total</Typography>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 300, margin: '0 auto', mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={result.score}
            sx={{
              height: 8, borderRadius: 4,
              backgroundColor: '#e2e8f0',
              '& .MuiLinearProgress-bar': { backgroundColor: scoreColor },
            }}
          />
        </Box>

        <Typography sx={{ fontSize: 16, fontWeight: 600, color: scoreColor }}>
          {result.score >= 80 ? '🎉 Excellent work!' :
           result.score >= 60 ? '👍 Good effort!' :
           result.score >= 40 ? '📖 Keep practicing!' :
           '💪 Don\'t give up — review and retry!'}
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#94a3b8', mt: 0.5 }}>
          Submitted: {new Date(result.submitted_at).toLocaleString()}
        </Typography>
      </Paper>

      {/* AI Insights Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Weak Areas */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ borderRadius: '12px', p: 2.5, border: '1px solid #fecaca', boxShadow: 'none', height: '100%', backgroundColor: '#fff5f5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningAmberIcon sx={{ color: '#dc2626', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#dc2626' }}>
                Weak Areas
              </Typography>
            </Box>
            {insights.weakTopics.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: '#64748b' }}>
                🎉 No weak areas — you got everything right!
              </Typography>
            ) : (
              insights.weakTopics.map((topic, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5, p: 1, borderRadius: '6px', backgroundColor: 'white', border: '1px solid #fecaca' }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#dc2626', mt: 0.2 }}>{i + 1}.</Typography>
                  <Typography sx={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.4 }}>{topic}</Typography>
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        {/* Improvement Tips */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ borderRadius: '12px', p: 2.5, border: '1px solid #bae6fd', boxShadow: 'none', height: '100%', backgroundColor: '#f0f9ff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LightbulbIcon sx={{ color: '#0369a1', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0369a1' }}>
                Improvement Tips
              </Typography>
            </Box>
            {insights.tips.map((tip, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.2 }}>
                <Typography sx={{ fontSize: 12, color: '#0369a1', fontWeight: 700, mt: 0.1 }}>•</Typography>
                <Typography sx={{ fontSize: 12, color: '#0c4a6e', lineHeight: 1.5 }}>{tip}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Next Steps */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ borderRadius: '12px', p: 2.5, border: '1px solid #bbf7d0', boxShadow: 'none', height: '100%', backgroundColor: '#f0fdf4' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUpIcon sx={{ color: '#059669', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#059669' }}>
                Recommended Next Steps
              </Typography>
            </Box>
            {insights.nextSteps.map((step, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.2 }}>
                <Typography sx={{ fontSize: 12, color: '#059669', fontWeight: 700, mt: 0.1 }}>→</Typography>
                <Typography sx={{ fontSize: 12, color: '#064e3b', lineHeight: 1.5 }}>{step}</Typography>
              </Box>
            ))}
            <Box sx={{ mt: 2 }}>
              <Chip
                icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                label={result.score >= 80 ? 'Ready for next topic' : result.score >= 60 ? 'Almost there' : 'Needs more practice'}
                size="small"
                color={result.score >= 80 ? 'success' : result.score >= 60 ? 'warning' : 'error'}
                sx={{ fontSize: 11, fontWeight: 600 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Answer Review */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
          Answer Review ({result.answers.length} questions)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`✅ ${result.correct_count} correct`} size="small" color="success" variant="outlined" sx={{ fontSize: 11 }} />
          <Chip label={`❌ ${result.wrong_count} wrong`} size="small" color="error" variant="outlined" sx={{ fontSize: 11 }} />
        </Box>
      </Box>

      {answersToShow.map((ans, idx) => (
        <Box
          key={ans.question_id}
          sx={{
            borderRadius: '8px', p: 2, mb: 1.5,
            borderLeft: `4px solid ${ans.is_correct ? '#10b981' : '#ef4444'}`,
            backgroundColor: ans.is_correct ? '#f0fdf4' : '#fff5f5',
            border: `1px solid ${ans.is_correct ? '#bbf7d0' : '#fecaca'}`,
            borderLeftWidth: '4px',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {ans.is_correct
                ? <CheckCircleIcon sx={{ color: '#059669', fontSize: 18 }} />
                : <CancelIcon sx={{ color: '#dc2626', fontSize: 18 }} />
              }
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Q{idx + 1}</Typography>
            </Box>
            <Chip label={ans.is_correct ? 'Correct' : 'Wrong'} size="small" color={ans.is_correct ? 'success' : 'error'} sx={{ fontSize: 11 }} />
          </Box>

          <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 1.5, lineHeight: 1.5 }}>
            {ans.question_text}
          </Typography>

          {ans.option_a && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, mb: 1.5 }}>
              {['A', 'B', 'C', 'D'].map((opt) => {
                const optText = ans[`option_${opt.toLowerCase()}`];
                if (!optText) return null;
                const isCorrect = ans.correct_answer === opt;
                const isSelected = ans.selected_answer === opt;
                return (
                  <Box
                    key={opt}
                    sx={{
                      display: 'flex', gap: 1, alignItems: 'flex-start', p: 1, borderRadius: '6px',
                      background: isCorrect ? '#d1fae5' : isSelected && !isCorrect ? '#fee2e2' : '#f8fafc',
                      border: `1px solid ${isCorrect ? '#10b981' : isSelected && !isCorrect ? '#ef4444' : '#e2e8f0'}`,
                    }}
                  >
                    <Typography sx={{ fontSize: 11, fontWeight: 700, minWidth: 16, color: isCorrect ? '#065f46' : isSelected ? '#991b1b' : '#64748b' }}>
                      {opt}.
                    </Typography>
                    <Typography sx={{ fontSize: 12 }}>{optText}</Typography>
                  </Box>
                );
              })}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: ans.explanation ? 1 : 0 }}>
            <Chip
              label={`Your answer: ${ans.selected_answer || 'Not answered'}`}
              size="small" color={ans.is_correct ? 'success' : 'error'}
              variant="outlined" sx={{ fontSize: 11 }}
            />
            {!ans.is_correct && (
              <Chip label={`Correct: ${ans.correct_answer}`} size="small" color="success" variant="outlined" sx={{ fontSize: 11 }} />
            )}
          </Box>

          {ans.explanation && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, p: 1.5, background: 'rgba(255,255,255,0.8)', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <LightbulbIcon sx={{ color: '#f59e0b', fontSize: 16, mt: 0.2, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 12, color: '#475569', fontStyle: 'italic', lineHeight: 1.5 }}>
                {ans.explanation}
              </Typography>
            </Box>
          )}
        </Box>
      ))}

      {result.answers.length > 3 && (
        <Box sx={{ textAlign: 'center', mt: 1, mb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => setShowAllAnswers(!showAllAnswers)}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            {showAllAnswers ? 'Show Less' : `Show All ${result.answers.length} Answers`}
          </Button>
        </Box>
      )}
    </Box>
  );
}