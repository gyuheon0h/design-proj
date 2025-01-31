import { Router } from 'express';
import registerRoute from './auth/register';
import loginRoute from './auth/login';

const router = Router();

// Collect all API routes
router.use('/register', registerRoute);
router.use('/login', loginRoute);

// Protected routes

export default router;
