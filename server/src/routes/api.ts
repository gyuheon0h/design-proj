import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API is working with TypeScript!' });
});

// PUT THIS IN ENV FILE
const JWT_SECRET = 'jwt-secret';

// Utils
const authenticate = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.locals.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

/** A. LOGIN */

/** A. LOGIN */
router.post('/login', async (req: Request, res: Response) => {});

/** B. BASIC FILE STUFF */

// 1. List files
router.get(
  '/files/:user_id',
  authenticate,
  async (req: Request, res: Response) => {},
);

router.get(
  '/files/shared/:user_id',
  authenticate,
  async (req: Request, res: Response) => {},
);

// 2. Download files
router.get('/fileDownload/:file_id', async (req: Request, res: Response) => {});

export default router;
