import { Router } from 'express';
import { authenticateUser } from '../../middleware/authMiddleware';

const router = Router();

// apply authentication middleware to all protected routes
router.use(authenticateUser);

// protected endpoints
// router.get('/files', getFiles); //import from authController
// router.post('/logout', logout);

export default router;
