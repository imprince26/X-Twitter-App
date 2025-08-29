import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing,
  blockUser,
  unblockUser,
  muteUser,
  unmuteUser,
  searchUsers,
  getUserPosts,
  getNotifications,
  markNotificationsAsRead
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { uploadProfileFiles } from '../services/media';

const router = Router();

// Public routes
router.get('/search', rateLimiter, searchUsers);
router.get('/:username', getUserProfile);
router.get('/:username/posts', getUserPosts);
router.get('/:username/followers', getUserFollowers);
router.get('/:username/following', getUserFollowing);

// Protected routes - Single endpoint for all profile updates
router.put('/profile', authenticate, rateLimiter,uploadProfileFiles, updateUserProfile);
router.post('/:username/follow', authenticate, rateLimiter, followUser);
router.delete('/:username/follow', authenticate, rateLimiter, unfollowUser);
router.post('/:username/block', authenticate, rateLimiter, blockUser);
router.delete('/:username/block', authenticate, rateLimiter, unblockUser);
router.post('/:username/mute', authenticate, rateLimiter, muteUser);
router.delete('/:username/mute', authenticate, rateLimiter, unmuteUser);

// Notifications
router.get('/notifications/all', authenticate, getNotifications);
router.put('/notifications/read', authenticate, markNotificationsAsRead);

export default router;