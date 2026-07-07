import express from 'express';
import {
  getGlobalStats,
  getAllDocuments,
  adminDeleteDocument,
  adminReindex,
  adminUploadDocument,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Apply protect (JWT validation) and authorize('admin') role guards to all admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getGlobalStats);
router.get('/documents', getAllDocuments);
router.delete('/documents/:id', adminDeleteDocument);
router.post('/reindex', adminReindex);
router.post('/documents/upload', upload.single('file'), adminUploadDocument);

export default router;
