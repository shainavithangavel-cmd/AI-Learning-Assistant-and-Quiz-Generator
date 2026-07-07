import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardCard from '../components/DashboardCard';
import useUserStore from '../stores/useUserStore';
import useAuthStore from '../stores/useAuthStore';

export default function AdminDashboard() {
  const { users, fetchUsers } = useUserStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  const trainers = users.filter((u) => u.role === 'TRAINER').length;
  const students = users.filter((u) => u.role === 'STUDENT').length;
  const admins   = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box>
          <Typography className="page-title">Admin Dashboard</Typography>
          <Typography className="page-subtitle">Welcome back, {user?.name}</Typography> 
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Total Users" value={users.length} icon={<PeopleIcon />} color="#4f46e5" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Trainers" value={trainers} icon={<PersonIcon />} color="#0891b2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Students" value={students} icon={<SchoolIcon />} color="#059669" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard title="Admins" value={admins} icon={<AdminPanelSettingsIcon />} color="#7c3aed" />
        </Grid>
      </Grid>

      <Box className="section-card">
        <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 15 }}>
          Recent Users
        </Typography>
        {users.slice(0, 5).map((u) => (
          <Box //each user each row
            key={u.id} //react need this while using .map
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              py: 1.2, borderBottom: '1px solid #f1f5f9',
              '&:last-child': { borderBottom: 'none' }
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{u.name}</Typography>
              <Typography sx={{ fontSize: 12, color: '#64748b' }}>{u.email}</Typography>
            </Box>
            <Box
              sx={{
                px: 1.5, py: 0.4, borderRadius: '20px', fontSize: 11, fontWeight: 600,
                backgroundColor: u.role === 'ADMIN' ? '#ede9fe' : u.role === 'TRAINER' ? '#dbeafe' : '#d1fae5',
                color: u.role === 'ADMIN' ? '#5b21b6' : u.role === 'TRAINER' ? '#1e40af' : '#065f46',
              }}
            >
              {u.role}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
