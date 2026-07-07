import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField, Button, Alert, CircularProgress,
  InputAdornment, IconButton, Typography, Box
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import useAuthStore from '../stores/useAuthStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent page refreshing
    const result = await login(email, password);
    if (result.success) {
      const dashMap = {
        ADMIN: '/admin',
        TRAINER: '/trainer',
        STUDENT: '/student'
      };
      navigate(dashMap[result.role] || '/login'); //role based redirection
    }
  };

  const features = [
    'AI-generated quizzes from your learning notes',
    'Trainer review, approval & regeneration workflow',
    'Real-time scoring with instant explanations',
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>

      {/* ── Left Panel — Branding ── */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          background: 'radial-gradient(circle at 20% 30%, #312e81 0%, #1e1b4b 45%, #0f0c29 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* subtle glow effect */}
        <Box
          sx={{
            position: 'absolute', bottom: -100, left: -100,
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 1 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <AutoAwesomeIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 20 }}>
            AI Quiz App
          </Typography>
        </Box>

        {/* Headline */}
        <Box sx={{ zIndex: 1 }}>
          <Typography sx={{ fontSize: 40, fontWeight: 800, lineHeight: 1.2, mb: 2 }}>
            Learn faster with{' '}
            <Box component="span" sx={{ color: '#a78bfa' }}>
              AI-powered
            </Box>{' '}
            quizzes
          </Typography>
          <Typography sx={{ fontSize: 15, color: '#c7d2fe', lineHeight: 1.7, maxWidth: 440 }}>
            Trainers create topics and notes, AI generates quiz questions, and students
            get instant feedback — all in one learning portal.
          </Typography>
        </Box>

        {/* Feature list */}
        <Box sx={{ zIndex: 1 }}>
          {features.map((f) => (
            <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <CheckCircleIcon sx={{ color: '#a78bfa', fontSize: 18 }} />
              <Typography sx={{ fontSize: 14, color: '#e0e7ff' }}>{f}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Right Panel — Sign In Form ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          p: 3,
        }}
      >
        <Box
          sx={{
            width: '100%', maxWidth: 420,
            backgroundColor: 'white',
            borderRadius: '16px',
            p: 4.5,
            boxShadow: '0 4px 30px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* mobile-only logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: '10px',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <AutoAwesomeIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>AI Quiz App</Typography>
          </Box>

          <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
            Sign in
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#64748b', mb: 3.5 }}>
            Enter your credentials to continue
          </Typography>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                {error}
              </Alert>
            )}

            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', mb: 0.7 }}>
              Email
            </Typography>
            <TextField
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              size="small"
              placeholder="you@example.com"
              sx={{ mb: 2.5 }}
            />

            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', mb: 0.7 }}>
              Password
            </Typography>
            <TextField
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              size="small"
              placeholder="••••••••••"
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.3,
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: 15,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3730a3, #6d28d9)',
                },
              }}
            >
              {loading
                ? <CircularProgress size={20} color="inherit" />
                : 'Sign In'
              }
            </Button>
          </form>

          {/* info note */}
          <Box
            sx={{
              mt: 3, p: 1.5, borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'flex-start', gap: 1,
            }}
          >
            <LockIcon sx={{ fontSize: 16, color: '#64748b', mt: 0.2, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
              Accounts are created by the administrator. Contact your admin to get access.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}