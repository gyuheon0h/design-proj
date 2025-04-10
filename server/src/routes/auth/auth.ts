import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import userModel from '../../dbModels/UserModel';
import { AuthenticatedRequest, authorize } from '../../middleware/authorize';

const authRouter = Router();

/** Auth API */

// '/' -> /api/auth/
// how do we know where tf this is called in front end?
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, passwordHash } = req.body;

    // Validate request body
    if (!username || !passwordHash) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // check if the user exists
    const user = await userModel.getUserByUsername(username);

    if (!user || user.passwordHash !== passwordHash) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET as string,
      // { expiresIn: process.env.JWT_EXPIRY || '1d' }, // TODO: fix later
    );

    res.cookie('authToken', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res
      .status(200)
      .json({ message: 'Login successful.', userId: user.id });
  } catch (error) {
    // Send error details only in development
    if (process.env.NODE_ENV === 'development') {
      return res
        .status(500)
        .json({ message: 'Internal server error.', error: String(error) });
    }
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

/** Register API */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, passwordHash } = req.body;

    // Validate request body
    if (!username || !email || !passwordHash) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Check if the username already exists
    const userExists = await userModel.userExists(username);
    if (userExists) {
      return res.status(409).json({ message: 'Username already taken.' });
    }

    // Check if email already registered
    const emailExists = await userModel.userExists(email);
    if (emailExists) {
      return res
        .status(409)
        .json({ message: 'You already registered with this email 🙄.' });
    }

    // Create new user
    const newUser = await userModel.create({ username, email, passwordHash });

    return res
      .status(201)
      .json({ message: 'User registered successfully.', user: newUser });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// this is almost exactly the same as login. However,
authRouter.post(
  '/verify-password',
  authorize,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { passwordHash } = req.body;
      const userId = req.user.userId;

      const user = await userModel.getById(userId);
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
  },
);

export default authRouter;

// edit , change endpoint in frontend.
