import { Router } from 'express';
import { authWebhook } from '../controllers/authController';

const router = Router();

router.post('/webhook', authWebhook);

export default router;