import { Router } from 'express';
import { getUser, updateUser, getUserById } from '../controllers/usersController';

const router = Router();

router.get('/me', getUser);
router.patch('/me', updateUser);
router.get('/:id', getUserById);

export default router;