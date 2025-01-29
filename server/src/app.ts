import express, { Application, Request, Response } from 'express';
import userModel from './db_models/userModel';
import cors from 'cors';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root Route
app.get('/', async (req: Request, res: Response) => {
  try {
    // SANITY TESTING INIT DEV
    const files = await StorageService.listAllFiles(); // Assuming this returns file names
    const users = await userModel.getAll();
    const newUser = await userModel.create({
      username: 'test_user_1',
    });
    res.send({
      message: 'Welcome to the Express server!',
      files,
      users: users,
      newUser: newUser,
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Routes
import apiRoutes from './routes/api';
import StorageService from './storage';
import { query } from './db_models/db';
app.use('/api', apiRoutes);

export default app;
