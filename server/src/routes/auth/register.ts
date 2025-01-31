import { Router, Request, Response } from 'express';
import userModel from '../../db_models/UserModel';

const router = Router();

/** ✅ Register API */
router.post('/', async (req: Request, res: Response) => {
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

export default router;
