import { Request, Response } from 'express';
import { User } from '../models/user';
import { Analytics } from '../models/analytics';
import logger from '../config/logger';

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, name, bio, profilePicture, coverImage, affiliatedAccounts } = req.body;
    const user = await User.findOne({ clerkId: req.auth.userId });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (affiliatedAccounts && !user.isVerified) {
      res.status(403).json({ error: 'Only verified users can add affiliated accounts' });
      return;
    }
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: req.auth.userId },
      { username, name, bio, profilePicture, coverImage, affiliatedAccounts },
      { new: true }
    );
    logger.info(`User updated: ${req.auth.userId}`);
    res.json(updatedUser);
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    await Analytics.create({ type: 'profile_view', targetId: user._id, userId: req.auth.userId });
    res.json(user);
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};