import { Request, Response } from 'express';
import { User } from '../models/userModel';
import { Follow } from '../models/followModel';
import { Block } from '../models/blockModel';
import { Mute } from '../models/muteModel';
import { Post } from '../models/postModel';
import { Notification } from '../models/notificationModel';
import { AuthenticatedRequest } from '../middleware/auth';

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const currentUserId = (req as AuthenticatedRequest).userId;

    const user = await User.findOne({ username }).select('-password -email -passwordResetToken -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user is blocked by this user
    if (currentUserId) {
      const isBlocked = await Block.findOne({ 
        blocker: user._id, 
        blocked: currentUserId 
      });
      
      if (isBlocked) {
        return res.status(403).json({ message: 'You are blocked by this user' });
      }
    }

    // Check follow status
    let isFollowing = false;
    let isFollowedBy = false;
    
    if (currentUserId && currentUserId !== user._id.toString()) {
      const followStatus = await Follow.findOne({ 
        follower: currentUserId, 
        following: user._id 
      });
      isFollowing = !!followStatus;

      const followedByStatus = await Follow.findOne({ 
        follower: user._id, 
        following: currentUserId 
      });
      isFollowedBy = !!followedByStatus;
    }

    res.json({
      user,
      isFollowing,
      isFollowedBy
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { name, bio, location, website, profilePicture, coverImage } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, bio, location, website, profilePicture, coverImage },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: 'Update failed', error });
  }
};

// Follow user
export const followUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { username } = req.params;

    const userToFollow = await User.findOne({ username });
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userId === userToFollow._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({ 
      follower: userId, 
      following: userToFollow._id 
    });
    
    if (existingFollow) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Check if blocked
    const isBlocked = await Block.findOne({ 
      $or: [
        { blocker: userId, blocked: userToFollow._id },
        { blocker: userToFollow._id, blocked: userId }
      ]
    });
    
    if (isBlocked) {
      return res.status(403).json({ message: 'Cannot follow this user' });
    }

    // Create follow relationship
    await Follow.create({ follower: userId, following: userToFollow._id });

    // Update follower counts
    await User.findByIdAndUpdate(userId, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(userToFollow._id, { $inc: { followersCount: 1 } });

    // Create notification
    await Notification.create({
      recipient: userToFollow._id,
      sender: userId,
      type: 'follow'
    });

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Unfollow user
export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { username } = req.params;

    const userToUnfollow = await User.findOne({ username });
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const follow = await Follow.findOneAndDelete({ 
      follower: userId, 
      following: userToUnfollow._id 
    });
    
    if (!follow) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    // Update follower counts
    await User.findByIdAndUpdate(userId, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(userToUnfollow._id, { $inc: { followersCount: -1 } });

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get user followers
export const getUserFollowers = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followers = await Follow.find({ following: user._id })
      .populate('follower', 'username name profilePicture isVerified')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Follow.countDocuments({ following: user._id });

    res.json({
      followers: followers.map(f => f.follower),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get user following
export const getUserFollowing = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const following = await Follow.find({ follower: user._id })
      .populate('following', 'username name profilePicture isVerified')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Follow.countDocuments({ follower: user._id });

    res.json({
      following: following.map(f => f.following),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Block user
export const blockUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { username } = req.params;

    const userToBlock = await User.findOne({ username });
    if (!userToBlock) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userId === userToBlock._id.toString()) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    // Check if already blocked
    const existingBlock = await Block.findOne({ 
      blocker: userId, 
      blocked: userToBlock._id 
    });
    
    if (existingBlock) {
      return res.status(400).json({ message: 'User already blocked' });
    }

    // Create block
    await Block.create({ blocker: userId, blocked: userToBlock._id });

    // Remove follow relationships
    await Follow.findOneAndDelete({ follower: userId, following: userToBlock._id });
    await Follow.findOneAndDelete({ follower: userToBlock._id, following: userId });

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Unblock user
export const unblockUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { username } = req.params;

    const userToUnblock = await User.findOne({ username });
    if (!userToUnblock) {
      return res.status(404).json({ message: 'User not found' });
    }

    const block = await Block.findOneAndDelete({ 
      blocker: userId, 
      blocked: userToUnblock._id 
    });
    
    if (!block) {
      return res.status(400).json({ message: 'User not blocked' });
    }

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Mute user
export const muteUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { username } = req.params;

    const userToMute = await User.findOne({ username });
    if (!userToMute) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userId === userToMute._id.toString()) {
      return res.status(400).json({ message: 'You cannot mute yourself' });
    }

    // Check if already muted
    const existingMute = await Mute.findOne({ 
      muter: userId, 
      muted: userToMute._id,
      type: 'user'
    });
    
    if (existingMute) {
      return res.status(400).json({ message: 'User already muted' });
    }

    await Mute.create({ 
      muter: userId, 
      muted: userToMute._id,
      type: 'user'
    });

    res.json({ message: 'User muted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Unmute user
export const unmuteUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { username } = req.params;

    const userToUnmute = await User.findOne({ username });
    if (!userToUnmute) {
      return res.status(404).json({ message: 'User not found' });
    }

    const mute = await Mute.findOneAndDelete({ 
      muter: userId, 
      muted: userToUnmute._id,
      type: 'user'
    });
    
    if (!mute) {
      return res.status(400).json({ message: 'User not muted' });
    }

    res.json({ message: 'User unmuted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Search users
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchRegex = new RegExp(q as string, 'i');
    
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { name: searchRegex }
      ],
      isActive: true
    })
    .select('username name profilePicture isVerified bio')
    .skip((page - 1) * limit)
    .limit(limit);

    const total = await User.countDocuments({
      $or: [
        { username: searchRegex },
        { name: searchRegex }
      ],
      isActive: true
    });

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get user posts
export const getUserPosts = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string || 'tweets'; // tweets, replies, media, likes

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query: any = { author: user._id, isDeleted: false };

    switch (type) {
      case 'replies':
        query.type = 'reply';
        break;
      case 'media':
        query['media.0'] = { $exists: true };
        break;
      case 'tweets':
      default:
        query.type = { $in: ['tweet', 'quote'] };
        break;
    }

    if (type === 'likes') {
      // Get liked posts
      const likedPosts = await Post.aggregate([
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'post',
            as: 'likes'
          }
        },
        {
          $match: {
            'likes.user': user._id,
            isDeleted: false
          }
        },
        { $sort: { 'likes.createdAt': -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ]);

      return res.json({
        posts: likedPosts,
        pagination: {
          page,
          limit,
          total: likedPosts.length,
          pages: Math.ceil(likedPosts.length / limit)
        }
      });
    }

    const posts = await Post.find(query)
      .populate('author', 'username name profilePicture isVerified')
      .populate('originalPost')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const notifications = await Notification.find({ 
      recipient: userId,
      isDeleted: false 
    })
    .populate('sender', 'username name profilePicture isVerified')
    .populate('post', 'content')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

    const total = await Notification.countDocuments({ 
      recipient: userId,
      isDeleted: false 
    });

    const unreadCount = await Notification.countDocuments({ 
      recipient: userId,
      isDeleted: false,
      isRead: false 
    });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Mark notifications as read
export const markNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { notificationIds } = req.body;

    await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        recipient: userId 
      },
      { isRead: true }
    );

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};