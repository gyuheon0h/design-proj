import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import { User } from '../interfaces/User';
import { Permission } from '../interfaces/Permission';
import { useUser } from '../context/UserContext';
import { colors, avatarStyles } from '../Styles';

// Searchable Select Component
interface SearchableSelectProps {
  label: string;
  options: { id: string; username: string; email: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Search...',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredOptions =
    searchQuery.trim() === '' ? options : options.filter((option) =>
      option.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Styled Search Input */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)} // Ensure dropdown shows when input is clicked
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Hide dropdown on blur with delay
        sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            paddingLeft: 1,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: '1px solid #E0E0E0',
          },
          '& .MuiInputBase-input::placeholder': {
            color: colors.textSecondary,
            opacity: 1,
          },
        }}
        InputProps={{
          startAdornment: ( 
            <InputAdornment position="start">
              <SearchIcon sx={{ color: colors.textSecondary }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Dynamic User List (Styled Dropdown) */}
      {showDropdown && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            mt: '5px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 10,
            border: '1px solid #E0E0E0',
          }}
        >
          <List>
            {filteredOptions.length === 0 ? (
              <ListItem>
                <Typography color={colors.textSecondary}>No users found</Typography>
              </ListItem>
            ) : (
              filteredOptions.map((option) => (
                <ListItemButton
                  key={option.id}
                  onClick={() => {
                    onChange(option.id);
                    setSearchQuery(option.username);
                    setShowDropdown(false);
                  }}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                  }}
                >
                  <ListItemText primary={`${option.username} (${option.email})`} />
                </ListItemButton>
              ))
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

// Main Permissions Dialog Interface
interface PermissionDialogProps {
  open: boolean;
  onClose: () => void;
  fileId: string | null;
  folderId: string | null;
}

// Get All Users Function
const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_BASE_URL}/api/user/all`,
      { withCredentials: true }
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

const PermissionDialog: React.FC<PermissionDialogProps> = ({
  open,
  onClose,
  fileId,
  folderId,
}) => {
  const { userId } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // For adding new permission
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<'owner' | 'editor' | 'viewer'>('viewer');

  // Determine resource type and ID
  const resourceType = fileId ? 'file' : 'folder';
  const resourceId = fileId || folderId;

  // Fetch Permissions
  const fetchPermissions = async () => {
    if (!resourceId) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/${resourceType}/${resourceId}/permissions`,
        { withCredentials: true }
      );
      setPermissions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error getting permissions:', error);
    }
  };

  // Fetch Data
  const fetchData = async () => {
    setIsDataLoaded(false);
    const [fetchedUsers] = await Promise.all([getAllUsers()]);
    setUsers(fetchedUsers);
    await fetchPermissions();
    setIsDataLoaded(true);
  };

  // Effect for data loading
  useEffect(() => {
    if (open) {
      fetchData();
    } else {
      // Clear state when closing
      setUsers([]);
      setPermissions([]);
      setIsDataLoaded(false);
      setNewUserId('');
      setNewRole('viewer');
    }
  }, [open, fileId, folderId]);

  // Handle Role Change
  const handleRoleChange = async (
    permissionId: string,
    userId: string,
    newRoleValue: 'editor' | 'viewer',
  ) => {
    if (!resourceId) return;
    try {
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/api/${resourceType}/${resourceId}/permissions/${userId}`,
        { role: newRoleValue },
        { withCredentials: true }
      );
      // Optimistically update state
      setPermissions((prevPermissions) =>
        prevPermissions.map((perm) =>
          perm.id === permissionId ? { ...perm, role: newRoleValue } : perm
        )
      );
    } catch (error) {
      console.error('Error updating permission role:', error);
    }
  };

  // Handle Remove Permission
  const handleRemovePermission = async (
    permissionId: string,
    userId: string,
  ) => {
    if (!resourceId) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/api/${resourceType}/${resourceId}/permissions/${userId}`,
        { withCredentials: true }
      );
      // Remove from state
      setPermissions((prevPermissions) =>
        prevPermissions.filter((perm) => perm.id !== permissionId)
      );
    } catch (error) {
      console.error('Error removing permission:', error);
    }
  };

  // Handle Add Permission
  const handleAddPermission = async () => {
    if (!resourceId || !newUserId) return;
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/api/${resourceType}/${resourceId}/permissions/${newUserId}`,
        { role: newRole },
        { withCredentials: true }
      );
      const newPermission: Permission = response.data;
      // Add new permission to state
      setPermissions((prev) => [...prev, newPermission]);

      // Reset form
      setNewUserId('');
      setNewRole('viewer');
    } catch (error) {
      console.error('Error adding permission:', error);
    }
  };

  // Users without existing permissions
  const usersWithoutPermission = users.filter(
    (u) => !permissions.some((p) => p.userId === u.id && !p.deletedAt)
  );

  // Get a color for user avatars
  const getUserColor = (username: string) => {
    const colors = ['#F44336', '#3F51B5', '#4CAF50', '#FF9800', '#9C27B0', '#607D8B'];
    const charCode = username.charCodeAt(0) % colors.length;
    return colors[charCode];
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Manage Permissions
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: colors.textSecondary }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ padding: '24px' }}>
        {!isDataLoaded ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress size={40} sx={{ color: colors.accentBlue }} />
          </Box>
        ) : (
          <>
            {/* Current Permissions */}
            <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
              Current Permissions
            </Typography>
            {permissions.length > 0 ? (
              <Box sx={{ mb: 4 }}>
                {permissions
                  .filter((perm) => !perm.deletedAt && perm.userId !== userId)
                  .map((perm) => {
                    const user = users.find((u) => u.id === perm.userId);
                    return (
                      <Paper
                        key={perm.id}
                        elevation={0}
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2,
                          p: 2,
                          borderRadius: '8px',
                          border: '1px solid #E0E0E0',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: getUserColor(user?.username || '?'),
                              color: '#FFFFFF',
                              width: 32,
                              height: 32,
                              fontSize: 14,
                              mr: 2,
                            }}
                          >
                            {user?.username?.charAt(0).toUpperCase() || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {user?.username || 'Unknown User'}
                            </Typography>
                            <Typography variant="body2" color={colors.textSecondary}>
                              {user?.email || 'No email available'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <FormControl size="small" sx={{ mr: 2, minWidth: 120 }}>
                            <InputLabel>Role</InputLabel>
                            <Select
                              value={perm.role}
                              label="Role"
                              onChange={(e) =>
                                handleRoleChange(
                                  perm.id,
                                  perm.userId,
                                  e.target.value as 'editor' | 'viewer',
                                )
                              }
                            >
                              <MenuItem value="editor">Editor</MenuItem>
                              <MenuItem value="viewer">Viewer</MenuItem>
                            </Select>
                          </FormControl>

                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() =>
                              handleRemovePermission(perm.id, perm.userId)
                            }
                            sx={{ borderRadius: '8px' }}
                          >
                            Remove
                          </Button>
                        </Box>
                      </Paper>
                    );
                  })}
              </Box>
            ) : (
              <Paper
                elevation={0}
                sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  borderRadius: '8px',
                  mb: 4,
                }}
              >
                <Typography color={colors.textSecondary}>No permissions found</Typography>
              </Paper>
            )}

            {/* Add Permission Section */}
            <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
              Add Permission
            </Typography>
            
            <Box sx={{ position: 'relative', mb: 3 }}>
              <SearchableSelect
                label="User"
                options={usersWithoutPermission.map(user => ({
                  id: user.id,
                  username: user.username,
                  email: user.email
                }))}
                value={newUserId}
                onChange={setNewUserId}
                placeholder="Search users by name or email"
              />

              {/* Role Select and Add Button */}
              <Box display="flex" alignItems="center" mt={3}>
                <FormControl size="small" sx={{ mr: 2, minWidth: 120 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={newRole}
                    label="Role"
                    onChange={(e) =>
                      setNewRole(e.target.value as 'editor' | 'viewer')
                    }
                  >
                    <MenuItem value="editor">Editor</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  onClick={handleAddPermission}
                  disabled={!newUserId}
                  sx={{ 
                    borderRadius: '8px', 
                    textTransform: 'none',
                    boxShadow: 'none',
                    backgroundColor: colors.accentBlue,
                    '&:hover': {
                      backgroundColor: '#2a70e2',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Add User
                </Button>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #E0E0E0' }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          sx={{ 
            borderRadius: '8px', 
            textTransform: 'none',
            borderColor: '#E0E0E0',
            color: colors.textPrimary,
            '&:hover': {
              borderColor: '#BDBDBD',
              backgroundColor: 'rgba(0,0,0,0.03)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionDialog;