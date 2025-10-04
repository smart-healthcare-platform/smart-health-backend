import { Router } from 'express';
import { getConversations, getMessages, createConversation } from '../controllers/conversationController';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

router.get('/conversations', authenticateToken, getConversations);
router.get('/conversations/:conversationId/messages', authenticateToken, getMessages);
router.post('/conversations', authenticateToken, createConversation); // Thêm route mới

export default router;