import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes/api'; // Collects all API routes
import { query } from './db_models/db';
import StorageService from './storage';

const app: Application = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',  // Allow requests from React frontend
    credentials: true,  // Allow cookies to be sent with requests
  }));
  
app.use(express.json());

// Root Route
app.get('/', async (req: Request, res: Response) => {
  try {
    const files = await StorageService.listAllFiles(); // Assuming this returns file names
    const rows = await query('SELECT * FROM "User"'); // Fetch rows from the database
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

// Mount API Routes under `/api`
app.use('/api', apiRoutes);

export default app;
