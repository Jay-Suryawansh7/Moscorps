import { Router } from 'express';
const router = Router();

import authRoutes from './auth.routes';
router.use('/auth', authRoutes);

import postRoutes from './post.routes';

router.use('/api', postRoutes);

export default router;