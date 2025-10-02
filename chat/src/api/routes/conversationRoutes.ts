import { Router } from 'express';
import { getConversations, getMessages } from '../controllers/conversationController';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

router.get('/conversations', authenticateToken, getConversations);
router.get('/conversations/:conversationId/messages', authenticateToken, getMessages);

export default router;