import express, { Application } from 'express';
import cors from 'cors';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
import apiRoutes from './routes/api';
app.use('/api', apiRoutes);

export default app;
