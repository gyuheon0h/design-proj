import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    res.json({ message: 'API is working with TypeScript!' });
});

export default router;
