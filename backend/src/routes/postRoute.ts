import { Router } from 'express';
import {
  createPost,
  getTimeline,
  getPost,
  likePost,
  unlikePost,
  retweetPost,
  unretweetPost,
  bookmarkPost,
  removeBookmark,
  voteOnPoll,
  getPostReplies,
  deletePost,
  getTrendingPosts,
  searchPosts
} from '../controllers/postController';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.get('/trending', getTrendingPosts);
router.get('/search', rateLimiter, searchPosts);
router.get('/:postId', getPost);
router.get('/:postId/replies', getPostReplies);

// Protected routes
router.post('/', authenticate, rateLimiter, createPost);
router.get('/feed/timeline', authenticate, getTimeline);
router.delete('/:postId', authenticate, deletePost);

// Engagement routes
router.post('/:postId/like', authenticate, rateLimiter, likePost);
router.delete('/:postId/like', authenticate, rateLimiter, unlikePost);
router.post('/:postId/retweet', authenticate, rateLimiter, retweetPost);
router.delete('/:postId/retweet', authenticate, rateLimiter, unretweetPost);
router.post('/:postId/bookmark', authenticate, rateLimiter, bookmarkPost);
router.delete('/:postId/bookmark', authenticate, rateLimiter, removeBookmark);
router.post('/:postId/vote', authenticate, rateLimiter, voteOnPoll);

export default router;