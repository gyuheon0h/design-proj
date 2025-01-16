import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { fileExists, getFileStream } from '../storage';

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
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const client = await pool.connect();

  try {
    const result = await client.query('SELECT * FROM "User" WHERE email = $1', [
      email,
    ]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h',
    });
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

/** B. BASIC FILE STUFF */

// 1. List files
router.get(
  '/files/:user_id',
  authenticate,
  async (req: Request, res: Response) => {
    const userId = req.params.user_id;
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT id, fileName, size, storagePath FROM "File" WHERE owner_id = $1',
        [userId],
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching files' });
    } finally {
      client.release();
    }
  },
);

router.get(
  '/files/shared/:user_id',
  authenticate,
  async (req: Request, res: Response) => {
    const userId = req.params.user_id;
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT id, fileName, size, storagePath FROM "File" WHERE $1 = ANY(shared_with)',
        [userId],
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching shared files' });
    } finally {
      client.release();
    }
  },
);

// 2. Download files
router.get('/fileDownload/:file_id', async (req: Request, res: Response) => {
  const fileId = req.params.file_id;
  const client = await pool.connect();

  try {
    const result = await client.query('SELECT * FROM "File" WHERE id = $1', [
      fileId,
    ]);
    const file = result.rows[0];

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { storagePath, fileName } = file;

    if (!(await fileExists(storagePath))) {
      return res.status(404).json({ error: 'File not found in storage' });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    getFileStream(storagePath).pipe(res);
  } catch (err) {
    console.error('Error fetching file:', err);
    res.status(500).json({ error: 'Error downloading file' });
  } finally {
    client.release();
  }
});

export default router;
