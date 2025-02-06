import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import SHA256 from 'crypto-js/sha256';

const SettingsPage = () => {
  const { username: contextUsername, setUsername: updateContextUsername } = useUser();
  const [formData, setFormData] = useState({
    username: '',
    currentPassword: '',
    newPassword: ''
  });
  const [errors, setErrors] = useState({
    username: false,
    currentPassword: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize form with current username from context
    if (contextUsername) {
      setFormData(prev => ({
        ...prev,
        username: contextUsername
      }));
    }
  }, [contextUsername]);

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      const hashedPassword = SHA256(password).toString()
      const response = await fetch('http://localhost:5001/api/settings/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ passwordHash: hashedPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        setErrors(prev => ({
          ...prev,
          currentPassword: true
        }));
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  };

  const handleSaveChanges = async () => {
    if (!formData.currentPassword) {
      setErrors(prev => ({
        ...prev,
        currentPassword: true
      }));
      return;
    }

    if (await verifyPassword(formData.currentPassword)) {
      try {
        const updateData: { username?: string; newPassword?: string } = {};
        
        // Only include username if it's changed
        if (formData.username !== contextUsername) {
          updateData.username = formData.username;
        }
        
        // Only include password if it's provided
        if (formData.newPassword) {
          updateData.newPassword = SHA256(formData.newPassword).toString();
        }

        // Don't make the request if there's nothing to update
        if (Object.keys(updateData).length === 0) {
          navigate('/home');
          return;
        }

        const response = await fetch('http://localhost:5001/api/settings/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          // Update context username if it was changed
          if (updateData.username) {
            updateContextUsername(updateData.username);
          }
          navigate('/home');
        } else {
          const error = await response.json();
          if (error.error === 'Username already taken') {
            setErrors(prev => ({
              ...prev,
              username: true
            }));
          }
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!formData.currentPassword) {
      setErrors(prev => ({
        ...prev,
        currentPassword: true
      }));
      return;
    }

    if (await verifyPassword(formData.currentPassword)) {
      if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        try {
          const response = await fetch('http://localhost:5001/api/settings/delete-account', {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            navigate('/');
          }
        } catch (error) {
          console.error('Error deleting account:', error);
        }
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        padding: 4,
        maxWidth: 400,
        margin: '0 auto',
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        boxShadow: 2,
      }}
    >
      <Typography variant="h4" fontWeight="bold" sx={{ color: '#333' }}>
        Account Settings
      </Typography>

      <Typography variant="body2">
        To edit any fields, please enter your current password.
      </Typography>

      <TextField
        label="Username"
        value={formData.username}
        onChange={handleInputChange('username')}
        error={errors.username}
        helperText={errors.username ? 'Username already taken' : ''}
        fullWidth
      />

      <TextField
        label="Current Password"
        type="password"
        value={formData.currentPassword}
        onChange={handleInputChange('currentPassword')}
        error={errors.currentPassword}
        helperText={errors.currentPassword ? 'Incorrect password' : ''}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        label="New Password"
        type="password"
        value={formData.newPassword}
        onChange={handleInputChange('newPassword')}
        fullWidth
      />

      <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
        <Button variant="contained" color="primary" fullWidth onClick={handleSaveChanges}>
          Save Changes
        </Button>
        <Button
          variant="outlined"
          sx={{
            color: '#666',
            borderColor: '#bbb',
            '&:hover': {
              backgroundColor: '#f2f2f2',
              borderColor: '#aaa',
            },
          }}
          fullWidth
          onClick={() => navigate('/home')}
        >
          Cancel
        </Button>
      </Box>

      <Button
        variant="contained"
        color="error"
        fullWidth
        startIcon={<DeleteIcon />}
        onClick={handleDeleteAccount}
      >
        Delete Account
      </Button>
    </Box>
  );
};

export default SettingsPage;