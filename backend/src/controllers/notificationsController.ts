import { Request, Response } from 'express';
import { Notification } from '../models/notifications';
import logger from '../config/logger';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const notifications = await Notification.find({ userId })
      .populate('fromUserId')
      .populate('postId')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { read: true },
      { new: true }
    );
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    logger.info(`Notification marked as read by user ${userId}: ${req.params.id}`);
    res.json(notification);
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};