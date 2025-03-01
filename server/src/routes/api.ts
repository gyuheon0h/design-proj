import { Router } from 'express';
import authRouter from './auth/auth';
import fileRouter from './files/files';
import folderRouter from './folders/folders';
import userRouter from './users/users';
const router = Router();

// Collect all API routes
router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/file', fileRouter);
router.use('/folder', folderRouter);
export default router;
