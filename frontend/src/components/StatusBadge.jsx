import React from 'react';
import { Chip } from '@mui/material';

const statusConfig = {
  GENERATED: { label: 'Generated', color: 'warning' },
  APPROVED:  { label: 'Approved',  color: 'success' },
  REJECTED:  { label: 'Rejected',  color: 'error' },
  PUBLISHED: { label: 'Published', color: 'primary' },
  DRAFT:     { label: 'Draft',     color: 'default' },
  EASY:      { label: 'Easy',      color: 'success' },
  MEDIUM:    { label: 'Medium',    color: 'warning' },
  HARD:      { label: 'Hard',      color: 'error' },
  ADMIN:     { label: 'Admin',     color: 'secondary' },
  TRAINER:   { label: 'Trainer',   color: 'primary' },
  STUDENT:   { label: 'Student',   color: 'success' },
};

export default function StatusBadge({ status, size = 'small' }) {
  const config = statusConfig[status?.toUpperCase()] || { label: status, color: 'default' };
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      sx={{ fontWeight: 600, fontSize: '11px' }}
    />
  );
}
