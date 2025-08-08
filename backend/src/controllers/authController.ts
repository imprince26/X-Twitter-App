import { Request, Response } from 'express';
import { createClerkClient } from '@clerk/backend';
import { User } from '../models/user';
import logger from '../config/logger';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const authWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, type } = req.body;
    if (type === 'user.created' || type === 'user.updated') {
      await User.findOneAndUpdate(
        { clerkId: data.id },
        {
          clerkId: data.id,
          username: data.username || `user_${data.id}`,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Anonymous',
          profilePicture: data.image_url || '',
          isVerified: data.public_metadata?.isPremium || false,
          affiliatedAccounts: data.public_metadata?.affiliatedAccounts || [],
        },
        { upsert: true, new: true }
      );
      logger.info(`User ${type} via webhook: ${data.id}`);
      res.status(200).send();
    } else {
      res.status(200).send();
    }
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username, firstName, lastName, isVerified = false, affiliatedAccounts = [] } = req.body;

    if (!req.auth?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const requestingUser = await User.findOne({ clerkId: req.auth.userId });
    if (!requestingUser || !requestingUser.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      password,
      username,
      firstName,
      lastName,
      publicMetadata: {
        isVerified,
        affiliatedAccounts,
      },
    });

    const user = await User.findOneAndUpdate(
      { clerkId: clerkUser.id },
      {
        clerkId: clerkUser.id,
        username: clerkUser.username || `user_${clerkUser.id}`,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Anonymous',
        profilePicture: clerkUser.imageUrl || '',
        isVerified: isVerified,
        affiliatedAccounts,
      },
      { upsert: true, new: true }
    );

    logger.info(`User created by admin ${req.auth.userId}: ${clerkUser.id}`);
    res.status(201).json(user);
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const requestingUser = await User.findOne({ clerkId: req.auth.userId });
    if (!requestingUser || !requestingUser.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { limit = 10, offset = 0 } = req.query;
    const clerkUsers = await clerkClient.users.getUserList({
      limit: Number(limit),
      offset: Number(offset),
    });

    // Sync Clerk users with MongoDB
    const users = await Promise.all(
      clerkUsers.data.map(async (clerkUser) => {
        const user = await User.findOneAndUpdate(
          { clerkId: clerkUser.id },
          {
            clerkId: clerkUser.id,
            username: clerkUser.username || `user_${clerkUser.id}`,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Anonymous',
            profilePicture: clerkUser.imageUrl || '',
            isVerified: clerkUser.publicMetadata?.isPremium || false,
            affiliatedAccounts: clerkUser.publicMetadata?.affiliatedAccounts || [],
          },
          { upsert: true, new: true }
        );
        return user;
      })
    );

    logger.info(`Fetched ${users.length} users by admin ${req.auth.userId}`);
    res.json(users);
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const requestingUser = await User.findOne({ clerkId: req.auth.userId });
    if (!requestingUser || !requestingUser.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const clerkUser = await clerkClient.users.getUser(req.params.id);
    if (!clerkUser) {
      res.status(404).json({ error: 'User not found in Clerk' });
      return;
    }

    const user = await User.findOneAndUpdate(
      { clerkId: clerkUser.id },
      {
        clerkId: clerkUser.id,
        username: clerkUser.username || `user_${clerkUser.id}`,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Anonymous',
        profilePicture: clerkUser.imageUrl || '',
        isVerified: clerkUser.publicMetadata?.isPremium || false,
        affiliatedAccounts: clerkUser.publicMetadata?.affiliatedAccounts || [],
      },
      { upsert: true, new: true }
    );

    logger.info(`Fetched user ${clerkUser.id} by admin ${req.auth.userId}`);
    res.json(user);
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const getUserToken = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth?.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const requestingUser = await User.findOne({ clerkId: req.auth.userId });
    if (!requestingUser || !requestingUser.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Verify user exists in Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Generate JWT token for the user
    const token = await clerkClient.sessions.createSessionToken(userId, {
      template: 'default', // Use default JWT template or customize in Clerk Dashboard
      expiresInSeconds: 3600, // 1 hour
    });

    logger.info(`Generated token for user ${userId} by admin ${req.auth.userId}`);
    res.json({ token });
  } catch (error) {
    logger.error('Get user token error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
};
