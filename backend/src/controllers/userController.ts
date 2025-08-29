import { Request, Response } from 'express';
import { User } from '../models/userModel';
import { Follow } from '../models/followModel';
import { Block } from '../models/blockModel';
import { Mute } from '../models/muteModel';
import { Post } from '../models/postModel';
import { Notification } from '../models/notificationModel';
import { AuthenticatedRequest } from '../middleware/auth';
import { uploadMultipleMediaHandler, deleteMedia,extractPublicId } from '../services/media';


// Get user profile
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;
    const currentUserId = (req as AuthenticatedRequest).userId;

    const user = await User.findOne({ username })
      .select('-password -emailVerificationCode -passwordResetCode -twoFactorSecret -loginAttempts -lockUntil');
    
    if (!user) {
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
      return;
    }

    // Check if user is active and not suspended
    if (!user.isActive || user.isSuspended) {
      res.status(403).json({ 
        success: false,
        message: 'User account is not available' 
      });
      return;
    }

    // Check if current user is blocked by this user
    if (currentUserId && currentUserId !== user._id.toString()) {
      const isBlocked = await Block.findOne({ 
        blocker: user._id, 
        blocked: currentUserId 
      });
      
      if (isBlocked) {
        res.status(403).json({ 
          success: false,
          message: 'You are blocked by this user' 
        });
        return;
      }
    }

    // Check follow status
    let isFollowing = false;
    let isFollowedBy = false;
    let isBlocking = false;
    let isMuted = false;
    
    if (currentUserId && currentUserId !== user._id.toString()) {
      const [followStatus, followedByStatus, blockStatus, muteStatus] = await Promise.all([
        Follow.findOne({ follower: currentUserId, following: user._id }),
        Follow.findOne({ follower: user._id, following: currentUserId }),
        Block.findOne({ blocker: currentUserId, blocked: user._id }),
        Mute.findOne({ muter: currentUserId, muted: user._id, type: 'user' })
      ]);

      isFollowing = !!followStatus;
      isFollowedBy = !!followedByStatus;
      isBlocking = !!blockStatus;
      isMuted = !!muteStatus;
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        relationship: {
          isFollowing,
          isFollowedBy,
          isBlocking,
          isMuted,
          isSelf: currentUserId === user._id.toString()
        }
      }
    });
  } catch (error: any) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

// Update user profile
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { name, bio, location, website, theme, language, timezone } = req.body;
    
    // Find the current user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
      return;
    }

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let profilePictureUrl = user.profilePicture;
    let coverImageUrl = user.coverImage;

    // Handle profile picture upload
    if (files?.profilePicture && files.profilePicture[0]) {
      // Delete existing profile picture if it exists
      if (user.profilePicture) {
        const publicId = extractPublicId(user.profilePicture);
        if (publicId) {
          await deleteMedia(publicId);
        }
      }
      
      // Set new profile picture URL
      profilePictureUrl = files.profilePicture[0].path;
    }
console.log(files)
    // Handle cover image upload
    if (files?.coverImage && files.coverImage[0]) {
      // Delete existing cover image if it exists
      if (user.coverImage) {
        const publicId = extractPublicId(user.coverImage);
        if (publicId) {
          await deleteMedia(publicId);
        }
      }
      
      // Set new cover image URL
      coverImageUrl = files.coverImage[0].path;
    }
    console.log(coverImageUrl)

    // Prepare update data
    const updateData: any = {
      profilePicture: profilePictureUrl,
      coverImage: coverImageUrl
    };

    // Add other fields if provided
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (theme !== undefined) updateData.theme = theme;
    if (language !== undefined) updateData.language = language;
    if (timezone !== undefined) updateData.timezone = timezone;
console.log("update data:",updateData)
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password -emailVerificationCode -passwordResetToken -twoFactorSecret -loginAttempts -lockUntil');

    if (!updatedUser) {
      res.status(404).json({ 
        success: false,
        message: 'Failed to update user profile' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error: any) {
    console.error('Update user profile error:', error);
    
    // If there was an error, try to clean up any uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files?.profilePicture && files.profilePicture[0]) {
      const publicId = extractPublicId(files.profilePicture[0].path);
      if (publicId) {
        await deleteMedia(publicId);
      }
    }
    if (files?.coverImage && files.coverImage[0]) {
      const publicId = extractPublicId(files.coverImage[0].path);
      if (publicId) {
        await deleteMedia(publicId);
      }
    }

    res.status(500).json({ 
      success: false,
      message: 'Failed to update user profile',
      error: error.message
    });
  }
};

// Follow user
export const followUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { username } = req.params;

    const userToFollow = await User.findOne({ username });
    if (!userToFollow) {
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
      return;
    }

    if (userId === userToFollow._id.toString()) {
      res.status(400).json({ 
        success: false,
        message: 'You cannot follow yourself' 
      });
      return;
    }

    // Check if already following
    const existingFollow = await Follow.findOne({ 
      follower: userId, 
      following: userToFollow._id 
    });
    
    if (existingFollow) {
      res.status(400).json({ 
        success: false,
        message: 'Already following this user' 
      });
      return;
    }

    // Check if blocked
    const isBlocked = await Block.findOne({ 
      $or: [
        { blocker: userId, blocked: userToFollow._id },
        { blocker: userToFollow._id, blocked: userId }
      ]
    });
    
    if (isBlocked) {
      res.status(403).json({ 
        success: false,
        message: 'Cannot follow this user' 
      });
      return;
    }

    // Create follow relationship
    await Follow.create({ follower: userId, following: userToFollow._id });

    // Update follower counts
    await Promise.all([
      User.findByIdAndUpdate(userId, { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(userToFollow._id, { $inc: { followersCount: 1 } })
    ]);

    // Create notification (only if user is not private or already following back)
    if (!userToFollow.isPrivate) {
      await Notification.create({
        recipient: userToFollow._id,
        sender: userId,
        type: 'follow'
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'User followed successfully' 
    });
  } catch (error: any) {
    console.error('Follow user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to follow user',
      error: error.message
    });
  }
};

// Unfollow user
export const unfollowUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { username } = req.params;

    const userToUnfollow = await User.findOne({ username });
    if (!userToUnfollow) {
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
      return;
    }

    const follow = await Follow.findOneAndDelete({ 
      follower: userId, 
      following: userToUnfollow._id 
    });
    
    if (!follow) {
      res.status(400).json({ 
        success: false,
        message: 'Not following this user' 
      });
      return;
    }

    // Update follower counts
    await Promise.all([
      User.findByIdAndUpdate(userId, { $inc: { followingCount: -1 } }),
      User.findByIdAndUpdate(userToUnfollow._id, { $inc: { followersCount: -1 } })
    ]);

    res.status(200).json({ 
      success: true,
      message: 'User unfollowed successfully' 
    });
  } catch (error: any) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to unfollow user',
      error: error.message
    });
  }
};

// Block user
export const blockUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { username } = req.params;

    const userToBlock = await User.findOne({ username });
    if (!userToBlock) {
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
      return;
    }

    if (userId === userToBlock._id.toString()) {
      res.status(400).json({ 
        success: false,
        message: 'You cannot block yourself' 
      });
      return;
    }

    // Check if already blocked
    const existingBlock = await Block.findOne({ 
      blocker: userId, 
      blocked: userToBlock._id 
    });
    
    if (existingBlock) {
      res.status(400).json({ 
        success: false,
        message: 'User already blocked' 
      });
      return;
    }

    // Create block
    await Block.create({ blocker: userId, blocked: userToBlock._id });

    // Remove follow relationships
    await Promise.all([
      Follow.findOneAndDelete({ follower: userId, following: userToBlock._id }),
      Follow.findOneAndDelete({ follower: userToBlock._id, following: userId }),
      // Update follower counts
      User.findByIdAndUpdate(userId, { $inc: { followingCount: -1 } }),
      User.findByIdAndUpdate(userToBlock._id, { $inc: { followersCount: -1 } })
    ]);

    res.status(200).json({ 
      success: true,
      message: 'User blocked successfully' 
    });
  } catch (error: any) {
    console.error('Block user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to block user',
      error: error.message
    });
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