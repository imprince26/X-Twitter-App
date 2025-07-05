import { Request, Response } from 'express';
import { Message } from '../models/message';
import logger from '../config/logger';

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { receiverId, text } = req.body;
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const message = await Message.create({ senderId: userId, receiverId, text });
    logger.info(`Message sent by user ${userId} to ${receiverId}: ${message._id}`);
    res.status(201).json(message);
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: userId },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
        },
      },
    ]);
    res.json(conversations);
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};