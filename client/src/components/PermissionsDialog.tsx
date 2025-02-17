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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

interface PermissionDialogProps {
  open: boolean;
  onClose: () => void;
  fileId: string | null;
  folderId: string | null;
}

interface Permission {
  id: string;
  fileId: string; // or folderId if it's a folder
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  deletedAt: Date | null;
}

interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  deletedAt?: Date | null;
  email: string;
}

const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await axios.get('http://localhost:5001/api/user/all', {
      withCredentials: true,
    });
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
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // For adding new permission
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<'owner' | 'editor' | 'viewer'>(
    'viewer',
  );

  // We’ll figure out which endpoint base to use
  const resourceType = fileId ? 'file' : 'folder';
  const resourceId = fileId || folderId;

  const fetchPermissions = async () => {
    if (!resourceId) return;
    try {
      const response = await axios.get(
        `http://localhost:5001/api/${resourceType}/${resourceId}/permissions`,
        { withCredentials: true },
      );
      setPermissions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error getting permissions:', error);
    }
  };

  const fetchData = async () => {
    setIsDataLoaded(false);
    const [fetchedUsers] = await Promise.all([getAllUsers()]);
    setUsers(fetchedUsers);
    await fetchPermissions();
    setIsDataLoaded(true);
  };

  useEffect(() => {
    if (open) {
      fetchData();
    } else {
      // clear state when closing
      setUsers([]);
      setPermissions([]);
      setIsDataLoaded(false);
      setNewUserId('');
      setNewRole('viewer');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileId, folderId]);

  const handleRoleChange = async (
    permissionId: string,
    userId: string,
    newRoleValue: 'editor' | 'viewer',
  ) => {
    if (!resourceId) return;
    try {
      await axios.put(
        `http://localhost:5001/api/${resourceType}/${resourceId}/permissions/${userId}`,
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

  const handleRemovePermission = async (
    permissionId: string,
    userId: string,
  ) => {
    if (!resourceId) return;
    try {
      await axios.delete(
        `http://localhost:5001/api/${resourceType}/${resourceId}/permissions/${userId}`,
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

  const handleAddPermission = async () => {
    if (!resourceId || !newUserId) return;
    try {
      const response = await axios.put(
        `http://localhost:5001/api/${resourceType}/${resourceId}/permissions/${newUserId}`,
        {
          role: newRole,
        },
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

  // Get users who do NOT yet have permission
  const usersWithoutPermission = users.filter(
    (u) => !permissions.some((p) => p.userId === u.id && !p.deletedAt),
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        Manage Permissions
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!isDataLoaded ? (
          <Box display="flex" justifyContent="center" alignItems="center">
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Existing Permissions */}
            <Typography variant="h6" gutterBottom>
              Current Permissions
            </Typography>
            {permissions.length > 0 ? (
              permissions
                .filter((perm) => !perm.deletedAt) // skip any that might be "deleted"
                .map((perm) => {
                  const user = users.find((u) => u.id === perm.userId);
                  return (
                    <Box
                      key={perm.id}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={2}
                    >
                      <Box>
                        <Typography variant="body1">
                          {user?.username} ({user?.email})
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        {/* Role Select */}
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
                          onClick={() =>
                            handleRemovePermission(perm.id, perm.userId)
                          }
                        >
                          Remove
                        </Button>
                      </Box>
                    </Box>
                  );
                })
            ) : (
              <Typography>No permissions found.</Typography>
            )}

            {/* Add Permission Section */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Add Permission
            </Typography>
            {usersWithoutPermission.length === 0 ? (
              <Typography variant="body2">
                All users already have permissions, or no users are available.
              </Typography>
            ) : (
              <Box display="flex" alignItems="center" mt={1}>
                {/* User Select */}
                <FormControl size="small" sx={{ mr: 2, minWidth: 200 }}>
                  <InputLabel>User</InputLabel>
                  <Select
                    value={newUserId}
                    label="User"
                    onChange={(e) => setNewUserId(e.target.value)}
                  >
                    {usersWithoutPermission.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Role Select */}
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
                >
                  Add
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary" variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionDialog;
