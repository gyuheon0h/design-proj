import { Router } from 'express';
import registerRoute from './auth/register';
import protectedRoutes from './auth/protectedRoutes';

const router = Router();

// Collect all API routes
router.use('/register', registerRoute); // Accessible at /api/register

// add additional protected API routes (routes that require sign-in)
router.use('/u', protectedRoutes);

export default router;
