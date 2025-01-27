import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root Route
app.get('/', async (req: Request, res: Response) => {
  const files = await listAllFiles();
  res.send(`Welcome to the Express server! ${files} lol`);
});

// Routes
import apiRoutes from './routes/api';
import { listAllFiles } from './storage';
app.use('/api', apiRoutes);

export default app;
