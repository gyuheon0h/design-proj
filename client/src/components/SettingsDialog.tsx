import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import SHA256 from 'crypto-js/sha256';
import { typography } from '../Styles';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const userContext = useUser();
  const { username: contextUsername, setUsername: updateContextUsername } =
    useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
  });

  const [errors, setErrors] = useState({
    username: false,
    currentPassword: false,
  });

  useEffect(() => {
    if (contextUsername) {
      setFormData((prev) => ({
        ...prev,
        username: contextUsername,
      }));
    }
  }, [contextUsername]);

  const handleInputChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
      if (errors[field as keyof typeof errors]) {
        setErrors((prev) => ({
          ...prev,
          [field]: false,
        }));
      }
    };

  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      const hashedPassword = SHA256(password).toString();
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/verify-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ passwordHash: hashedPassword }),
        },
      );

      if (!response.ok) {
        setErrors((prev) => ({
          ...prev,
          currentPassword: true,
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
      setErrors((prev) => ({
        ...prev,
        currentPassword: true,
      }));
      return;
    }

    if (await verifyPassword(formData.currentPassword)) {
      try {
        const updateData: { username?: string; newPassword?: string } = {};

        if (formData.username !== contextUsername) {
          updateData.username = formData.username;
        }

        if (formData.newPassword) {
          updateData.newPassword = SHA256(formData.newPassword).toString();
        }

        if (Object.keys(updateData).length === 0) {
          onClose();
          return;
        }

        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/user/${userContext.userId}/update-profile`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updateData),
          },
        );

        if (response.ok) {
          if (updateData.username) {
            updateContextUsername(updateData.username);
          }
          onClose();
        } else {
          const error = await response.json();
          if (error.error === 'Username already taken') {
            setErrors((prev) => ({
              ...prev,
              username: true,
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
      setErrors((prev) => ({
        ...prev,
        currentPassword: true,
      }));
      return;
    }

    if (await verifyPassword(formData.currentPassword)) {
      if (
        window.confirm(
          'Are you sure you want to delete your account? This action cannot be undone.',
        )
      ) {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/user/${userContext.userId}/delete-account`,
            {
              method: 'DELETE',
              credentials: 'include',
            },
          );
          if (response.ok) {
            navigate('/');
          } else {
            console.error('Error deleting account:');
            navigate('/');
          }
        } catch (error) {
          console.error('Error deleting account:', error);
        }
      }
    }
  };

  const handleClose = () => {
    setFormData({
      username: contextUsername || '',
      currentPassword: '',
      newPassword: '',
    });
    setErrors({
      username: false,
      currentPassword: false,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          fontFamily: typography.fontFamily,
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        Account Settings
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" sx={{ textAlign: 'center', mb: 1 }}>
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
        </Box>
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', padding: 3, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
          <Button
            variant="contained"
            onClick={handleSaveChanges}
            fullWidth
            sx={{ fontFamily: typography.fontFamily }}
          >
            Save Changes
          </Button>
          <Button
            onClick={handleClose}
            variant="outlined"
            fullWidth
            sx={{ fontFamily: typography.fontFamily }}
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
          sx={{ mt: 1, fontFamily: typography.fontFamily }}
        >
          Delete Account
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
