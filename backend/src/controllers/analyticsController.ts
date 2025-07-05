import { Request, Response } from 'express';
import { Analytics } from '../models/analytics';
import logger from '../config/logger';

export const trackImpression = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, targetId } = req.body;
    const userId = req.auth.userId;
    await Analytics.create({ type, targetId, userId });
    logger.info(`Impression tracked: ${type} for ${targetId}`);
    res.status(201).send();
  } catch (error) {
    logger.error('Track impression error:', error);
    res.status(500).json({ error: 'Failed to track impression' });
  }
};

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, targetId } = req.params;
    const analytics = await Analytics.find({ type, targetId }).countDocuments();
    res.json({ count: analytics });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};