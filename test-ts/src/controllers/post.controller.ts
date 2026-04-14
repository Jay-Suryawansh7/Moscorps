import { Request, Response, NextFunction } from 'express';
import Post from '../models/Post';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export async function getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page: number = parseInt(req.query.page as string) || 1;
    const limit: number = parseInt(req.query.limit as string) || 10;
    const offset: number = (page - 1) * limit;
    
    const { count, rows } = await Post.findAndCountAll({
      include: [{ model: User, attributes: ['id', 'username', 'email'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      posts: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'username', 'email'] }]
    });
    
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    
    res.json(post);
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, content } = req.body;
    
    const post = await Post.create({
      title,
      content,
      userId: req.user?.userId
    });
    
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    
    if (post.userId !== req.user?.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    await post.update(req.body);
    res.json(post);
  } catch (error) {
    next(error);
  }
}

export async function deleteOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    
    if (post.userId !== req.user?.userId && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    await post.destroy();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
}