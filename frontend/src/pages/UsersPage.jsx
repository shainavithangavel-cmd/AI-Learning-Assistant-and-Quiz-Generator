import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton,
  Tooltip, Chip, Alert, CircularProgress, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment'; //eye icon
import Visibility from '@mui/icons-material/Visibility'; 
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import useUserStore from '../stores/useUserStore';
import StatusBadge from '../components/StatusBadge';

const defaultForm = { name: '', email: '', password: '', role: 'TRAINER' };

export default function UsersPage() {
  const { users, loading, fetchUsers, createUser, deleteUser } = useUserStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { //runs when the page loads
    fetchUsers();
  }, []);

  const filteredUsers = roleFilter === 'ALL'
    ? users
    : users.filter((u) => u.role === roleFilter);

  const handleCreate = async () => {
    setFormError(''); //clear prv error
    if (!form.name || !form.email || !form.password) {
      setFormError('All fields are required');
      return;
    }
    const result = await createUser(form);
    if (result.success) {
      setOpen(false);
      setForm(defaultForm);
      setSuccessMsg('User created successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setFormError(result.error);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    const result = await deleteUser(id);
    if (!result.success) alert(result.error);
  };

  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box>
          <Typography className="page-title">User Management</Typography>
          <Typography className="page-subtitle">
            Only admins can create accounts. Trainers and students cannot self-register.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setForm(defaultForm); setFormError(''); setShowPw(false); setOpen(true); }}
          sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
        >
          Add User
        </Button>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>{successMsg}</Alert>
      )}

      {/* Role filter tabs */}
      <ToggleButtonGroup
        value={roleFilter}
        exclusive
        onChange={(e, val) => val && setRoleFilter(val)}
        size="small"
        sx={{ mb: 2 }}
      >
        {['ALL', 'ADMIN', 'TRAINER', 'STUDENT'].map((r) => (
          <ToggleButton key={r} value={r} sx={{ textTransform: 'none', fontWeight: 500, px: 2 }}>
            {r} {r !== 'ALL' && `(${users.filter(u => u.role === r).length})`}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #e2e8f0' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: 12, color: '#64748b' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <CircularProgress size={24} />
              </TableCell></TableRow>
            )}
            {!loading && filteredUsers.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                No users found
              </TableCell></TableRow>
            )}
            {filteredUsers.map((u, i) => (
              <TableRow key={u.id} hover>
                <TableCell sx={{ fontSize: 13, color: '#94a3b8' }}>{i + 1}</TableCell>
                <TableCell sx={{ fontSize: 14, fontWeight: 500 }}>{u.name}</TableCell>
                <TableCell sx={{ fontSize: 13, color: '#64748b' }}>{u.email}</TableCell>
                <TableCell><StatusBadge status={u.role} /></TableCell>
                <TableCell sx={{ fontSize: 12, color: '#94a3b8' }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell>
                  <Tooltip title="Delete user">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(u.id, u.name)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create User Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New User</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{formError}</Alert>}
          <TextField
            label="Full Name" value={form.name} fullWidth size="small"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="Email Address" type="email" value={form.email} fullWidth size="small"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            type={showPw ? 'text' : 'password'}
            value={form.password}
            fullWidth size="small"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPw(!showPw)}
                    edge="end"
                    size="small"
                  >
                    {showPw ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select
              value={form.role}
              label="Role"
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <MenuItem value="TRAINER">Trainer</MenuItem>
              <MenuItem value="STUDENT">Student</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleCreate}
            disabled={loading}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            {loading ? <CircularProgress size={18} /> : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
