import { Router } from 'express';
import UserModel from '../../db_models/UserModel';

const userRouter = Router();

userRouter.get('/user', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await UserModel.getById(userId);
    return res.status(201).json({ user });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
