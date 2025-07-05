import { Request, Response } from 'express';
import { User } from '../models/user';
import { Post } from '../models/post';
import logger from '../config/logger';

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
      ],
    }).limit(10);
    res.json(users);
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

export const searchPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }
    const posts = await Post.find({
      text: { $regex: query, $options: 'i' },
    }).populate('userId').limit(10);
    res.json(posts);
  } catch (error) {
    logger.error('Search posts error:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
};