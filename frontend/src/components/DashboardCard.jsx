import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export default function DashboardCard({ title, value, icon, color = '#4f46e5', subtitle }) {
  return (
    <Card
      sx={{
        borderRadius: '12px',
        boxShadow: 'none',
        border: '1px solid #e2e8f0',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 50, height: 50,
              borderRadius: '10px',
              backgroundColor: color + '20',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, color,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
              {value ?? '—'}
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.3 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.2 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
