import { Request, Response } from 'express';
import { Post } from '../models/postModel';
import { Like } from '../models/likeModel';
import { Retweet } from '../models/retweetModel';
import { Bookmark } from '../models/bookmarkModel';
import { User } from '../models/userModel';
import { Follow } from '../models/followModel';
import { Notification } from '../models/notificationModel';
import { PollVote } from '../models/pollVoteModel';
import { Hashtag } from '../models/hashtagModel';
import { AuthenticatedRequest } from '../middleware/auth';

// Create a new post
export const createPost = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { 
      content, 
      media, 
      poll, 
      visibility = 'public',
      scheduledFor,
      location,
      replyTo 
    } = req.body;

    // Extract hashtags and mentions
    const hashtags = content.match(/#\w+/g)?.map((tag: string) => tag.slice(1).toLowerCase()) || [];
    const mentions = content.match(/@\w+/g)?.map((mention: string) => mention.slice(1)) || [];

    // Get mentioned user IDs
    const mentionedUsers = await User.find({ 
      username: { $in: mentions } 
    }).select('_id');

    const post = new Post({
      content,
      author: userId,
      media,
      poll,
      hashtags,
      mentions: mentionedUsers.map(user => user._id),
      visibility,
      scheduledFor,
      location,
      type: replyTo ? 'reply' : 'tweet',
      replyTo
    });

    await post.save();

    // Update hashtag counts
    for (const tag of hashtags) {
      await Hashtag.findOneAndUpdate(
        { name: tag },
        { 
          $inc: { count: 1 },
          $set: { lastUsed: new Date() }
        },
        { upsert: true }
      );
    }

    // Update user tweet count
    await User.findByIdAndUpdate(userId, { $inc: { tweetsCount: 1 } });

    // Create notifications for mentions
    for (const mentionedUser of mentionedUsers) {
      await Notification.create({
        recipient: mentionedUser._id,
        sender: userId,
        type: 'mention',
        post: post._id
      });
    }

    // If it's a reply, create notification and update counts
    if (replyTo) {
      const originalPost = await Post.findById(replyTo);
      if (originalPost) {
        await Post.findByIdAndUpdate(replyTo, { $inc: { repliesCount: 1 } });
        
        if (originalPost.author.toString() !== userId) {
          await Notification.create({
            recipient: originalPost.author,
            sender: userId,
            type: 'reply',
            post: post._id
          });
        }
      }
    }

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username name profilePicture isVerified');

    res.status(201).json({ post: populatedPost });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create post', error });
  }
};

// Get home timeline
export const getTimeline = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get followed users
    const following = await Follow.find({ follower: userId }).select('following');
    const followingIds = following.map(f => f.following);
    followingIds.push(userId); // Include own posts

    const posts = await Post.find({
      author: { $in: followingIds },
      isDeleted: false,
      scheduledFor: { $lte: new Date() }
    })
    .populate('author', 'username name profilePicture isVerified')
    .populate('originalPost')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

    const total = await Post.countDocuments({
      author: { $in: followingIds },
      isDeleted: false,
      scheduledFor: { $lte: new Date() }
    });

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

// Get single post
export const getPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = (req as AuthenticatedRequest).userId;

    const post = await Post.findById(postId)
      .populate('author', 'username name profilePicture isVerified')
      .populate('originalPost')
      .populate('replyTo');

    if (!post || post.isDeleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment view count
    await Post.findByIdAndUpdate(postId, { $inc: { viewsCount: 1 } });

    // Check if user liked, retweeted, bookmarked
    let isLiked = false;
    let isRetweeted = false;
    let isBookmarked = false;

    if (userId) {
      isLiked = await Like.exists({ user: userId, post: postId });
      isRetweeted = await Retweet.exists({ user: userId, post: postId });
      isBookmarked = await Bookmark.exists({ user: userId, post: postId });
    }

    res.json({
      post,
      isLiked: !!isLiked,
      isRetweeted: !!isRetweeted,
      isBookmarked: !!isBookmarked
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Like a post
export const likePost = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already liked
    const existingLike = await Like.findOne({ user: userId, post: postId });
    if (existingLike) {
      return res.status(400).json({ message: 'Post already liked' });
    }

    // Create like
    await Like.create({ user: userId, post: postId });

    // Update like count
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });

    // Create notification
    if (post.author.toString() !== userId) {
      await Notification.create({
        recipient: post.author,
        sender: userId,
        type: 'like',
        post: postId
      });
    }

    res.json({ message: 'Post liked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Unlike a post
export const unlikePost = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { postId } = req.params;

    const like = await Like.findOneAndDelete({ user: userId, post: postId });
    if (!like) {
      return res.status(400).json({ message: 'Post not liked' });
    }

    // Update like count
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });

    res.json({ message: 'Post unliked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Retweet a post
export const retweetPost = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { postId } = req.params;
    const { comment } = req.body;

    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already retweeted
    const existingRetweet = await Retweet.findOne({ user: userId, post: postId });
    if (existingRetweet) {
      return res.status(400).json({ message: 'Post already retweeted' });
    }

    const type = comment ? 'quote' : 'retweet';

    // Create retweet
    await Retweet.create({ 
      user: userId, 
      post: postId, 
      comment,
      type
    });

    // Create retweet post if it's a quote tweet
    if (comment) {
      const quotePost = new Post({
        content: comment,
        author: userId,
        type: 'quote',
        originalPost: postId
      });
      await quotePost.save();
      
      await Post.findByIdAndUpdate(postId, { $inc: { quotesCount: 1 } });
    } else {
      await Post.findByIdAndUpdate(postId, { $inc: { retweetsCount: 1 } });
    }

    // Create notification
    if (post.author.toString() !== userId) {
      await Notification.create({
        recipient: post.author,
        sender: userId,
        type: comment ? 'quote' : 'retweet',
        post: postId
      });
    }

    res.json({ message: 'Post retweeted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Unretweet a post
export const unretweetPost = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { postId } = req.params;

    const retweet = await Retweet.findOneAndDelete({ user: userId, post: postId });
    if (!retweet) {
      return res.status(400).json({ message: 'Post not retweeted' });
    }

    // Update retweet count
    if (retweet.type === 'quote') {
      await Post.findByIdAndUpdate(postId, { $inc: { quotesCount: -1 } });
    } else {
      await Post.findByIdAndUpdate(postId, { $inc: { retweetsCount: -1 } });
    }

    res.json({ message: 'Post unretweeted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Bookmark a post
export const bookmarkPost = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { postId } = req.params;
    const { folder } = req.body;

    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({ user: userId, post: postId });
    if (existingBookmark) {
      return res.status(400).json({ message: 'Post already bookmarked' });
    }

    await Bookmark.create({ user: userId, post: postId, folder });

    // Update bookmark count
    await Post.findByIdAndUpdate(postId, { $inc: { bookmarksCount: 1 } });

    res.json({ message: 'Post bookmarked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Remove bookmark
export const removeBookmark = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { postId } = req.params;

    const bookmark = await Bookmark.findOneAndDelete({ user: userId, post: postId });
    if (!bookmark) {
      return res.status(400).json({ message: 'Post not bookmarked' });
    }

    // Update bookmark count
    await Post.findByIdAndUpdate(postId, { $inc: { bookmarksCount: -1 } });

    res.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Vote on poll
export const voteOnPoll = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { postId } = req.params;
    const { option } = req.body;

    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.poll) {
      return res.status(400).json({ message: 'Post does not have a poll' });
    }

    if (new Date() > post.poll.endsAt) {
      return res.status(400).json({ message: 'Poll has ended' });
    }

    // Check if already voted
    const existingVote = await PollVote.findOne({ user: userId, post: postId });
    if (existingVote) {
      return res.status(400).json({ message: 'Already voted on this poll' });
    }

    // Create vote
    await PollVote.create({ user: userId, post: postId, option });

    // Update poll counts
    await Post.findOneAndUpdate(
      { _id: postId, [`poll.options.${option}`]: { $exists: true } },
      { 
        $inc: { 
          [`poll.options.${option}.votes`]: 1,
          'poll.totalVotes': 1
        }
      }
    );

    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get post replies
export const getPostReplies = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const replies = await Post.find({ 
      replyTo: postId,
      isDeleted: false 
    })
    .populate('author', 'username name profilePicture isVerified')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

    const total = await Post.countDocuments({ 
      replyTo: postId,
      isDeleted: false 
    });

    res.json({
      replies,
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

// Delete post
export const deletePost = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndUpdate(postId, { isDeleted: true });

    // Update user tweet count
    await User.findByIdAndUpdate(userId, { $inc: { tweetsCount: -1 } });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get trending posts
export const getTrendingPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get posts from last 24 hours with high engagement
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const posts = await Post.find({
      createdAt: { $gte: oneDayAgo },
      isDeleted: false,
      visibility: 'public'
    })
    .populate('author', 'username name profilePicture isVerified')
    .sort({ 
      likesCount: -1, 
      retweetsCount: -1, 
      repliesCount: -1 
    })
    .skip((page - 1) * limit)
    .limit(limit);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total: posts.length,
        pages: Math.ceil(posts.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Search posts
export const searchPosts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchRegex = new RegExp(q as string, 'i');
    
    const posts = await Post.find({
      content: searchRegex,
      isDeleted: false,
      visibility: 'public'
    })
    .populate('author', 'username name profilePicture isVerified')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

    const total = await Post.countDocuments({
      content: searchRegex,
      isDeleted: false,
      visibility: 'public'
    });

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