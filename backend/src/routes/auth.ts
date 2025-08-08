import { Router } from 'express';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { authWebhook, createUser, getUsers, getUserById, getUserToken } from '../controllers/authController';

const router = Router();

router.post('/webhook', authWebhook);
router.post('/create-user', clerkMiddleware(), requireAuth(), createUser);
router.get('/users', clerkMiddleware(), requireAuth(), getUsers);
router.get('/users/:id', clerkMiddleware(), requireAuth(), getUserById);
router.post('/user-token', clerkMiddleware(), requireAuth(), getUserToken);

export default router;