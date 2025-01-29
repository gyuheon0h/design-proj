import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root Route
app.get('/', async (req: Request, res: Response) => {
  try {
    const files = await StorageService.listAllFiles(); // Assuming this returns file names
    const rows = await query('SELECT * FROM users'); // Fetch rows from the database
    res.send({
      message: 'Welcome to the Express server!',
      files,
      users: rows,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Routes
import apiRoutes from './routes/api';
import StorageService from './storage';
import { query } from './db';
app.use('/api', apiRoutes);

export default app;
