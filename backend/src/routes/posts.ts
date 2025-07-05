import { Router } from 'express';
import {
  createPost,
  getPost,
  getPosts,
  deletePost,
  replyToPost,
  retweetPost,
  likePost,
  unlikePost,
} from '../controllers/postsController';

const router = Router();

router.post('/', createPost);
router.get('/:id', getPost);
router.get('/', getPosts);
router.delete('/:id', deletePost);
router.post('/:id/reply', replyToPost);
router.post('/:id/retweet', retweetPost);
router.post('/:id/like', likePost);
router.delete('/:id/like', unlikePost);

export default router;