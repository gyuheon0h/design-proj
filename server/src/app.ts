import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes/api'; // Collects all API routes
import { query } from './db_models/db';
import StorageService from './storage';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

const app: Application = express();
dotenv.config(); // we need this to be able to access things like userId in our environment as a whole.
// Middleware
app.use(
  cors({
    // for development purposes; UNCOMMENT THIS For most purposes.
    origin: process.env.CLIENT_BASE_URL, // Allow requests from React frontend
    credentials: true, // Allow cookies to be sent with requests
  }),
);
app.use(express.json());
app.use(cookieParser());

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
