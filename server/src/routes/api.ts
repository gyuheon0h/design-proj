import { Router } from 'express';
import registerRouter from './auth/register';
import loginRouter from './auth/login';
import fileRouter from './files/files';
import folderRouter from './folders/folders';

const router = Router();

// Collect all API routes
router.use('/register', registerRouter);
router.use('/login', loginRouter);

// Protected routes
router.use('/file', fileRouter);
router.use('/folder', folderRouter);
export default router;
