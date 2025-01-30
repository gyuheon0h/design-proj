import { Router } from 'express';
import registerRoute from './auth/register';

const router = Router();

// Collect all API routes
router.use('/register', registerRoute); // Accessible at /api/register

export default router;
