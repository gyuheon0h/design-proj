import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Chip,
  MenuItem,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import axios from 'axios';

interface ShareActionProps {
  id: string; // ID of file/folder
  name: string; // Name of the file/folder
  allUsers: string[];
  open: boolean; // Control modal visibility
  onClose: () => void; // Function to close modal
}

interface SharingData {
  docId: string;
  name: string;
  shared: string[];
  permissions: string[];
}

const ShareAction = ({ id, name, open, onClose }: ShareActionProps) => {
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [tempSharedWith, setTempSharedWith] = useState<string[]>([]);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);

  const permissionOptions = ['Read', 'Write', 'Admin'];

  // Fetch shared users & permissions from the API when modal opens
  useEffect(() => {
    if (open) {
      fetchData(id);
    }
  }, [open, id]);

  const fetchData = async (docId: string) => {
    try {
      const response = await axios.get<SharingData>(
        `http://localhost:5001/api/shared/${docId}`,
        { withCredentials: true },
      );

      setSharedWith(response.data.shared);
      setPermissions(response.data.permissions);
      setTempSharedWith(response.data.shared);
      setTempPermissions(response.data.permissions);
    } catch (error) {
      console.error('Error fetching shared data:', error);
    }
  };

  // Update permission in local state only
  const handleTempPermissionChange = (
    userId: string,
    newPermission: string,
  ) => {
    setTempPermissions((prevPermissions) =>
      prevPermissions.map((perm, index) =>
        tempSharedWith[index] === userId ? newPermission : perm,
      ),
    );
  };

  // Remove user from local state only
  const handleTempRemoveSharedUser = (userId: string) => {
    setTempSharedWith((prev) => prev.filter((user) => user !== userId));
    setTempPermissions((prev) =>
      prev.filter((_, index) => tempSharedWith[index] !== userId),
    );
  };

  // Save changes to the backend
  const handleSaveChanges = async () => {
    try {
      await axios.put(
        `http://localhost:5001/api/shared/${id}`,
        {
          shared: tempSharedWith,
          permissions: tempPermissions,
        },
        { withCredentials: true },
      );

      // Update actual state after API call
      setSharedWith(tempSharedWith);
      setPermissions(tempPermissions);
      onClose(); // Close the modal after saving
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  // Cancel and reset changes
  const handleCancel = () => {
    setTempSharedWith(sharedWith);
    setTempPermissions(permissions);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Share {name}</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          sx={{ '& > :not(style)': { m: 1, width: '100%' } }}
          noValidate
          autoComplete="off"
        >
          <TextField id="input-user" label="Enter User" variant="outlined" />
        </Box>
        <Typography variant="h6" mt={2}>
          Users shared with:
        </Typography>
        <Box mt={1}>
          {tempSharedWith.map((user, index) => (
            <Chip
              key={user}
              label={
                <Box display="flex" alignItems="center">
                  <span>{user} - </span>
                  <Select
                    value={tempPermissions[index]}
                    onChange={(e) =>
                      handleTempPermissionChange(user, e.target.value as string)
                    }
                    size="small"
                    sx={{ marginLeft: 1 }}
                  >
                    {permissionOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              }
              onDelete={() => handleTempRemoveSharedUser(user)}
              sx={{ margin: 0.5 }}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSaveChanges} color="primary" variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareAction;
