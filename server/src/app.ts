import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());


// Root Route
app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the Express server!');
});


// Routes
import apiRoutes from './routes/api';
app.use('/api', apiRoutes);

export default app;
