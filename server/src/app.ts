import express, { Application } from 'express';
import cors from 'cors';
import apiRoutes from './routes/api'; // Collects all API routes

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount API Routes under `/api`
app.use('/api', apiRoutes);

export default app;
