import { Router } from 'express';
import { followUser, unfollowUser, getFollowers, getFollowing } from '../controllers/followsController';

const router = Router();

router.post('/:userId', followUser);
router.delete('/:userId', unfollowUser);
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);

export default router;