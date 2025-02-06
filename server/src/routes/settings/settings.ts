import { Router } from 'express';
import { AuthenticatedRequest, authorize } from '../../middleware/authorize';
import UserModel from '../../db_models/UserModel';
import jwt from 'jsonwebtoken';

const settingsRouter = Router();

// All routes require authentication
settingsRouter.use(authorize);

// Original route: /api/verify-password
// New route: /api/settings/verify-password
settingsRouter.post('/verify-password', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { passwordHash } = req.body;
    const userId = req.user.userId;
    
    const user = await UserModel.getById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.passwordHash !== passwordHash) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    return res.json({ message: 'Password verified' });
  } catch (error) {
    console.error('Error verifying password:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Original route: /api/update-profile
// New route: /api/settings/update-profile
settingsRouter.post('/update-profile', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { username, newPassword } = req.body;
    const userId = req.user.userId;
    
    const user = await UserModel.getById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username && username !== user.username) {
      const existingUser = await UserModel.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const updateData: Partial<typeof user> = {};
    if (username) {
      updateData.username = username;
    }
    
    if (newPassword) {
      updateData.passwordHash = newPassword;
    }

    await UserModel.update(userId, updateData);

    if (username) {
      const token = jwt.sign(
        { userId, username },
        process.env.JWT_SECRET as string
      );

      res.cookie('authToken', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });
    }

    return res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Original route: /api/delete-account
// New route: /api/settings/delete-account
settingsRouter.delete('/delete-account', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const success = await UserModel.delete(userId);

    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.clearCookie('authToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict'
    });

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default settingsRouter;