import { Request, Response } from 'express';
import { Post } from '../models/post';
import { Like } from '../models/like';
import { Notification } from '../models/notifications';
import { Analytics } from '../models/analytics';
import logger from '../config/logger';

export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, media } = req.body;
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const post = await Post.create({ userId, text, media });
    logger.info(`Post created by user ${userId}: ${post._id}`);
    res.status(201).json(post);
  } catch (error) {
    logger.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id).populate('userId');
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    await Analytics.create({ type: 'post_impression', targetId: post._id, userId: req.auth.userId });
    res.json(post);
  } catch (error) {
    logger.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await Post.find()
      .populate('userId')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(posts);
  } catch (error) {
    logger.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    if (post.userId !== req.auth.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    await post.deleteOne();
    logger.info(`Post deleted by user ${req.auth.userId}: ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

export const replyToPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, media } = req.body;
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const post = await Post.create({ userId, text, media, replyTo: req.params.id });
    await Notification.create({
      userId: (await Post.findById(req.params.id)).userId,
      type: 'reply',
      fromUserId: userId,
      postId: req.params.id,
    });
    logger.info(`Reply created by user ${userId}: ${post._id}`);
    res.status(201).json(post);
  } catch (error) {
    logger.error('Reply to post error:', error);
    res.status(500).json({ error: 'Failed to reply to post' });
  }
};

export const retweetPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const post = await Post.create({ userId, retweetOf: req.params.id });
    await Notification.create({
      userId: (await Post.findById(req.params.id)).userId,
      type: 'retweet',
      fromUserId: userId,
      postId: req.params.id,
    });
    logger.info(`Retweet created by user ${userId}: ${post._id}`);
    res.status(201).json(post);
  } catch (error) {
    logger.error('Retweet post error:', error);
    res.status(500).json({ error: 'Failed to retweet post' });
  }
};

export const likePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const existingLike = await Like.findOne({ userId, postId: req.params.id });
    if (existingLike) {
      res.status(400).json({ error: 'Post already liked' });
      return;
    }
    const like = await Like.create({ userId, postId: req.params.id });
    await Notification.create({
      userId: (await Post.findById(req.params.id)).userId,
      type: 'like',
      fromUserId: userId,
      postId: req.params.id,
    });
    logger.info(`Like created by user ${userId}: ${like._id}`);
    res.status(201).json(like);
  } catch (error) {
    logger.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
};

export const unlikePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await Like.deleteOne({ userId, postId: req.params.id });
    logger.info(`Unlike by user ${userId}: ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Unlike post error:', error);
    res.status(500).json({ error: 'Failed to unlike post' });
  }
};