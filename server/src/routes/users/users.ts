import { Router } from 'express';
import UserModel from '../../db_models/UserModel';

const userRouter = Router();

userRouter.get('/', async (req, res) => {
  try {
    const userId = req.query.id;
    const user = await UserModel.getById(userId as string);
    return res.status(201).json({ user });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default userRouter;
