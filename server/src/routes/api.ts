import { Router } from 'express';
import fileRouter from './files/files';
import folderRouter from './folders/folders';
import userRouter from './users/users';
import authRouter from './auth/auth';
const router = Router();

// Collect all API routes
router.use('/auth', authRouter);

router.use('/user', userRouter);
router.use('/file', fileRouter);
router.use('/folder', folderRouter);
export default router;
