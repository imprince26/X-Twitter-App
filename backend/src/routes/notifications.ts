import { Router } from 'express';
import { getNotifications, markNotificationAsRead } from '../controllers/notificationsController';

const router = Router();

router.get('/', getNotifications);
router.patch('/:id', markNotificationAsRead);

export default router;