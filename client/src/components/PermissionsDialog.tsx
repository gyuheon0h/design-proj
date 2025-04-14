import React, { useEffect, useState, useCallback } from 'react';
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
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import { User } from '../interfaces/User';
import { Permission } from '../interfaces/Permission';
import { useUser } from '../context/UserContext';

// Searchable Select Component
interface SearchableSelectProps {
  options: { id: string; username: string; email: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Search...',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredOptions =
    searchQuery.trim() === ''
      ? options
      : options.filter(
          (option) =>
            option.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            option.email.toLowerCase().includes(searchQuery.toLowerCase()),
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
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Dynamic User List Dropdown */}
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
          <List disablePadding>
            {filteredOptions.length === 0 ? (
              <ListItem>
                <Typography color="text.secondary">No users found</Typography>
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
                    '&:hover': { backgroundColor: 'rgba(66, 134, 245, 0.08)' },
                  }}
                >
                  <ListItemText
                    primary={option.username}
                    secondary={option.email}
                    primaryTypographyProps={{
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{
                      sx: { fontSize: '0.8rem' },
                    }}
                  />
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
      { withCredentials: true },
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
  const [newRole, setNewRole] = useState<'editor' | 'viewer'>('viewer');

  // Determine resource type and ID
  const resourceType = fileId ? 'file' : 'folder';
  const resourceId = fileId || folderId;

  // Fetch Permissions - memoized with useCallback
  const fetchPermissions = useCallback(async () => {
    if (!resourceId) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/${resourceType}/${resourceId}/permissions`,
        { withCredentials: true },
      );
      setPermissions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error getting permissions:', error);
    }
  }, [resourceId, resourceType]); // Include dependencies that fetchPermissions relies on

  // Use useCallback to memoize the fetchData function
  const fetchData = useCallback(async () => {
    setIsDataLoaded(false);
    const [fetchedUsers] = await Promise.all([getAllUsers()]);
    setUsers(fetchedUsers);
    await fetchPermissions();
    setIsDataLoaded(true);
  }, [fetchPermissions]); // Include fetchPermissions as a dependency

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
  }, [open, fileId, folderId, fetchData]); // Added fetchData to dependencies

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
        { withCredentials: true },
      );
      // Optimistically update state
      setPermissions((prevPermissions) =>
        prevPermissions.map((perm) =>
          perm.id === permissionId ? { ...perm, role: newRoleValue } : perm,
        ),
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
        { withCredentials: true },
      );
      // Remove from state
      setPermissions((prevPermissions) =>
        prevPermissions.filter((perm) => perm.id !== permissionId),
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
        { withCredentials: true },
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
    (u) => !permissions.some((p) => p.userId === u.id && !p.deletedAt),
  );

  // Get a color for user avatars
  const getUserColor = (username: string) => {
    const colors = [
      '#4286f5',
      '#ea4335',
      '#34a853',
      '#fbbc05',
      '#673ab7',
      '#009688',
    ];
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
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #eee',
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Manage Permissions
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ padding: '24px' }}>
        {!isDataLoaded ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={4}
          >
            <CircularProgress size={40} sx={{ color: '#4286f5' }} />
          </Box>
        ) : (
          <>
            {/* Current Permissions */}
            <Typography
              variant="subtitle2"
              sx={{
                mb: 2,
                mt: 2,
                fontWeight: 'bold',
                color: 'text.secondary',
                letterSpacing: '0.5px',
              }}
            >
              CURRENT PERMISSIONS
            </Typography>

            {permissions.length > 0 ? (
              <Box sx={{ mb: 4 }}>
                {permissions
                  .filter((perm) => !perm.deletedAt)
                  .map((perm) => {
                    const user = users.find((u) => u.id === perm.userId);
                    const isOwner = perm.role === 'owner';

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
                          border: '1px solid #e0e0e0',
                          '&:hover': {
                            borderColor: '#bdbdbd',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              bgcolor: getUserColor(user?.username || '?'),
                              color: '#FFFFFF',
                              width: 36,
                              height: 36,
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
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {user?.email || 'No email available'}
                            </Typography>
                          </Box>
                        </Box>

                        <Box display="flex" alignItems="center">
                          {isOwner ? (
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="primary"
                              sx={{
                                px: 2,
                                py: 0.5,
                                borderRadius: '8px',
                                backgroundColor: '#e3f2fd',
                              }}
                            >
                              Owner
                            </Typography>
                          ) : (
                            <>
                              <FormControl
                                size="small"
                                sx={{ mr: 2, minWidth: 100 }}
                              >
                                <Select
                                  value={perm.role}
                                  onChange={(e) =>
                                    handleRoleChange(
                                      perm.id,
                                      perm.userId,
                                      e.target.value as 'editor' | 'viewer',
                                    )
                                  }
                                  sx={{
                                    borderRadius: '8px',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#e0e0e0',
                                    },
                                  }}
                                  displayEmpty
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
                                sx={{
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  borderColor: '#e0e0e0',
                                  color: '#d32f2f',
                                  '&:hover': {
                                    borderColor: '#d32f2f',
                                    backgroundColor: 'rgba(211, 47, 47, 0.04)',
                                  },
                                }}
                              >
                                Remove
                              </Button>
                            </>
                          )}
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
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  mb: 4,
                  border: '1px solid #e0e0e0',
                }}
              >
                <Typography color="text.secondary">
                  No permissions found
                </Typography>
              </Paper>
            )}

            <Divider sx={{ mb: 3 }} />

            {/* Add Permission Section */}
            <Typography
              variant="subtitle2"
              sx={{
                mb: 2,
                fontWeight: 'bold',
                color: 'text.secondary',
                letterSpacing: '0.5px',
              }}
            >
              ADD PERMISSION
            </Typography>

            <Box sx={{ position: 'relative', mb: 3 }}>
              <SearchableSelect
                options={usersWithoutPermission.map((user) => ({
                  id: user.id,
                  username: user.username,
                  email: user.email,
                }))}
                value={newUserId}
                onChange={setNewUserId}
                placeholder="Search users by name or email"
              />

              {/* Role Select and Add Button */}
              <Box display="flex" alignItems="center" mt={3}>
                <FormControl size="small" sx={{ mr: 2, minWidth: 100 }}>
                  <Select
                    value={newRole}
                    onChange={(e) =>
                      setNewRole(e.target.value as 'editor' | 'viewer')
                    }
                    displayEmpty
                    sx={{
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e0e0e0',
                      },
                    }}
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
                    backgroundColor: '#4286f5',
                    '&:hover': {
                      backgroundColor: '#3a76d8',
                      boxShadow: 'none',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#f5f5f5',
                      color: '#bdbdbd',
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

      <DialogActions
        sx={{
          padding: '16px 24px',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #eee',
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            color: '#666',
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionDialog;
