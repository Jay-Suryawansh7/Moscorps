import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/posts', authenticate, postController.getAll);
router.get('/posts/:id', authenticate, postController.getOne);
router.post('/posts', authenticate, postController.create);
router.put('/posts/:id', authenticate, postController.update);
router.delete('/posts/:id', authenticate, postController.deleteOne);

export default router;