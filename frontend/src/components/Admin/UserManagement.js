import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import { PersonAdd, PersonOff, AdminPanelSettings } from '@mui/icons-material';
import api from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [assignRoleDialog, setAssignRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Assign role to user
  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await api.post('/admin/assign-role', {
        email: selectedUser.email,
        role: newRole
      });

      setSuccess(`Role updated to ${newRole} for ${selectedUser.email}`);
      setAssignRoleDialog(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers(); // Refresh users list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign role');
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user) => {
    try {
      await api.post('/admin/toggle-user-status', {
        email: user.email
      });

      setSuccess(`User ${user.email} ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers(); // Refresh users list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle user status');
    }
  };

  // Open assign role dialog
  const openAssignRoleDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setAssignRoleDialog(true);
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? 'error' : 'primary';
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography>Loading users...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AdminPanelSettings />}
          onClick={fetchUsers}
          sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' }}
        >
          Refresh Users
        </Button>
      </Box>

      {/* Success/Error Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Users Table */}
      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={getStatusColor(user.isActive)}
                      size="small"
                      variant={user.isActive ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openAssignRoleDialog(user)}
                      >
                        Change Role
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color={user.isActive ? 'error' : 'success'}
                        onClick={() => handleToggleStatus(user)}
                        startIcon={user.isActive ? <PersonOff /> : <PersonAdd />}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Assign Role Dialog */}
      <Dialog
        open={assignRoleDialog}
        onClose={() => setAssignRoleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Role</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="User Email"
              value={selectedUser?.email || ''}
              disabled
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newRole}
                label="Role"
                onChange={(e) => setNewRole(e.target.value)}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignRoleDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAssignRole}
            variant="contained"
            disabled={!newRole}
          >
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!success || !!error}
        autoHideDuration={6000}
        onClose={() => {
          setSuccess('');
          setError('');
        }}
      >
        <Alert
          onClose={() => {
            setSuccess('');
            setError('');
          }}
          severity={success ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {success || error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
