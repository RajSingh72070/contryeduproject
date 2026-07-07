import express from 'express';
import { queryChat } from '../controllers/chatController.js';
import { getChatHistory, clearChatHistory } from '../controllers/historyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Private authenticated endpoints
router.post('/', protect, queryChat);
router.get('/history', protect, getChatHistory);
router.delete('/history', protect, clearChatHistory);
router.delete('/history/:sessionId', protect, clearChatHistory);

export default router;
