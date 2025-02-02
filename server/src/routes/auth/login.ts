import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import userModel from '../../db_models/UserModel';

dotenv.config();
const router = Router();

/** Login API */
router.post('/', async (req: Request, res: Response) => {
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
      httpOnly: true, // dont expose token
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day expiry
    });

    return res.status(200).json({ message: 'Login successful.' });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
