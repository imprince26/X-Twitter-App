import { Request, Response } from 'express';
import { Follow } from '../models/follow';
import { Notification } from '../models/notifications';
import logger from '../config/logger';

export const followUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const existingFollow = await Follow.findOne({ followerId: userId, followingId: req.params.userId });
    if (existingFollow) {
      res.status(400).json({ error: 'Already following' });
      return;
    }
    const follow = await Follow.create({ followerId: userId, followingId: req.params.userId });
    await Notification.create({
      userId: req.params.userId,
      type: 'follow',
      fromUserId: userId,
    });
    logger.info(`Follow created by user ${userId}: ${req.params.userId}`);
    res.status(201).json(follow);
  } catch (error) {
    logger.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
};

export const unfollowUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await Follow.deleteOne({ followerId: userId, followingId: req.params.userId });
    logger.info(`Unfollow by user ${userId}: ${req.params.userId}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

export const getFollowers = async (req: Request, res: Response): Promise<void> => {
  try {
    const followers = await Follow.find({ followingId: req.params.userId }).populate('followerId');
    res.json(followers);
  } catch (error) {
    logger.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
};

export const getFollowing = async (req: Request, res: Response): Promise<void> => {
  try {
    const following = await Follow.find({ followerId: req.params.userId }).populate('followingId');
    res.json(following);
  } catch (error) {
    logger.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
};