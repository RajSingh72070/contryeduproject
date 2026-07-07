import express from 'express';
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
} from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes are private and require JWT authorization
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.get('/', protect, getDocuments);
router.delete('/:id', protect, deleteDocument);

export default router;
