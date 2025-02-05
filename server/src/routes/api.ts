import { Router } from 'express';
import registerRouter from './auth/register';
import loginRouter from './auth/login';
import fileRouter from './files/files';
import folderRouter from './folders/folders';
import userRouter from './users/users';

const router = Router();

// Collect all API routes
router.use('/register', registerRouter);
router.use('/login', loginRouter);

router.use('/user', userRouter);
router.use('/file', fileRouter);
router.use('/folder', folderRouter);
export default router;
