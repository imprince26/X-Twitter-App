import { Router } from 'express';
import { sendMessage, getConversation, getConversations } from '../controllers/messagesController';

const router = Router();

router.post('/', sendMessage);
router.get('/:userId', getConversation);
router.get('/', getConversations);

export default router;