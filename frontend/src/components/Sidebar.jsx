import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Box, Divider, Avatar
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import TopicIcon from '@mui/icons-material/LibraryBooks';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import useAuthStore from '../stores/useAuthStore';

const SIDEBAR_WIDTH = 240;

// Navigation items per role
const navItems = {
  ADMIN: [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { label: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
  ],
  TRAINER: [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/trainer' },
    { label: 'Topics & Notes', icon: <TopicIcon />, path: '/trainer/topics' },
    { label: 'Create Quiz', icon: <QuizIcon />, path: '/trainer/create-quiz' },
    { label: 'My Quizzes', icon: <AssignmentIcon />, path: '/trainer/quizzes' },
  ],
  STUDENT: [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
    { label: 'My Quizzes', icon: <SchoolIcon />, path: '/student/quizzes' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const items = navItems[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#1e293b',
          color: '#e2e8f0',
          borderRight: 'none',
        },
      }}
    >
      {/* App Brand */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: '8px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <QuizIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f1f5f9', fontSize: 13 }}>
              AI Quiz App
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 11 }}>
              Learning Portal
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Nav Items */}
      <List sx={{ px: 1.5, pt: 2, flex: 1 }}>
        {items.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/admin' && item.path !== '/trainer' && item.path !== '/student'
              && location.pathname.startsWith(item.path));

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '8px',
                  py: 1,
                  backgroundColor: isActive ? '#4f46e5' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive ? '#4338ca' : '#334155',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'white' : '#94a3b8' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'white' : '#cbd5e1',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Info + Logout */}
      <Box sx={{ p: 2, borderTop: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#4f46e5', fontSize: 13 }}>
            {user.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
              {user.role}
            </Typography>
          </Box>
        </Box>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: '8px', py: 0.8,
            color: '#f87171',
            '&:hover': { backgroundColor: '#334155' },
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Logout</Typography>
        </ListItemButton>
      </Box>
    </Drawer>
  );
}
