import express from 'express';
import {
  reindexDocuments,
  getKnowledgeStats,
  deindexDocument,
} from '../controllers/knowledgeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are private and protected by JWT auth middleware
router.post('/reindex', protect, reindexDocuments);
router.get('/', protect, getKnowledgeStats);
router.delete('/:id', protect, deindexDocument);

export default router;
