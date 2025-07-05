import { Request, Response } from 'express';
import { User } from '../models/User';
import logger from '../config/logger';

export const authWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, type } = req.body;
    if (type === 'user.created') {
      await User.create({
        clerkId: data.id,
        username: data.username || `user_${data.id}`,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Anonymous',
        profilePicture: data.image_url || '',
        isVerified: data.public_metadata?.isPremium || false, // Blue tick for premium
        affiliatedAccounts: data.public_metadata?.affiliatedAccounts || [],
      });
      logger.info(`User created via webhook: ${data.id}`);
      res.status(200).send();
    } else if (type === 'user.updated') {
      await User.findOneAndUpdate(
        { clerkId: data.id },
        {
          username: data.username || `user_${data.id}`,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Anonymous',
          profilePicture: data.image_url || '',
          isVerified: data.public_metadata?.isPremium || false,
          affiliatedAccounts: data.public_metadata?.affiliatedAccounts || [],
        }
      );
      logger.info(`User updated via webhook: ${data.id}`);
      res.status(200).send();
    } else {
      res.status(200).send();
    }
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};