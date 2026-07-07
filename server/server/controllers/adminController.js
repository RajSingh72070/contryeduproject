import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import Document from '../models/Document.js';
import { indexDocument, deleteDocumentEmbeddings, getVectorStoreStats } from '../rag/ragService.js';
import { parseDocument } from '../services/documentParser.js';

/**
 * @desc    Get system-wide metrics and statistics
 * @route   GET /admin/stats
 * @access  Private/Admin
 */
export const getGlobalStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const documentCount = await Document.countDocuments();
    const indexedCount = await Document.countDocuments({ status: 'indexed' });
    const failedCount = await Document.countDocuments({ status: 'failed' });

    // Try fetching stats from ChromaDB
    const vectorStats = await getVectorStoreStats(req.user._id);

    return res.status(200).json({
      status: 'success',
      data: {
        totalUsers: userCount,
        totalDocuments: documentCount,
        indexedDocuments: indexedCount,
        failedDocuments: failedCount,
        chromaStatus: vectorStats.status,
        vectorCount: vectorStats.vectorCount,
      },
    });
  } catch (error) {
    console.error('[Admin Stats Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve global system metrics',
    });
  }
};

/**
 * @desc    Get all documents uploaded in the system (cross-user)
 * @route   GET /admin/documents
 * @access  Private/Admin
 */
export const getAllDocuments = async (req, res) => {
  try {
    const { search } = req.query;

    const query = {};
    if (search && search.trim() !== '') {
      query.originalName = { $regex: search, $options: 'i' };
    }

    // Fetch documents populating owner name/email
    const documents = await Document.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error('[Admin Get Documents Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to query global documents catalog',
    });
  }
};

/**
 * @desc    Delete any document in the system
 * @route   DELETE /admin/documents/:id
 * @access  Private/Admin
 */
export const adminDeleteDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found',
      });
    }

    // 1. Delete physical file
    try {
      if (fs.existsSync(document.path)) {
        await fs.promises.unlink(document.path);
        console.log(`[Admin] Physically deleted file: ${document.path}`);
      }
    } catch (fsErr) {
      console.error(`[Admin File Delete Error] Path: ${document.path}:`, fsErr);
    }

    // 2. Delete Chroma embeddings
    try {
      await deleteDocumentEmbeddings(documentId);
    } catch (vectorErr) {
      console.warn(`[Admin RAG Warning] Failed to delete vectors for doc ${documentId}:`, vectorErr.message);
    }

    // 3. Delete database record
    await Document.deleteOne({ _id: documentId });

    return res.status(200).json({
      status: 'success',
      message: 'Document permanently deleted from system database, vectors, and storage.',
    });
  } catch (error) {
    console.error('[Admin Delete Document Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete document',
    });
  }
};

/**
 * @desc    Reindex all unindexed system documents
 * @route   POST /admin/reindex
 * @access  Private/Admin
 */
export const adminReindex = async (req, res) => {
  try {
    const unindexedDocs = await Document.find({ status: 'processed' });

    if (unindexedDocs.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No documents need indexing.',
        data: { indexedCount: 0 },
      });
    }

    let indexedCount = 0;
    const failures = [];

    for (const doc of unindexedDocs) {
      try {
        await indexDocument(doc, doc.user);
        indexedCount++;
      } catch (err) {
        console.error(`[Admin Reindex Error] Document: ${doc.originalName}:`, err);
        failures.push({ name: doc.originalName, error: err.message });
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `System-wide reindexing complete. Successfully embedded ${indexedCount} document(s).`,
      data: {
        indexedCount,
        failedCount: failures.length,
        failures,
      },
    });
  } catch (error) {
    console.error('[Admin Reindex Controller Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process global system reindexing',
    });
  }
};

/**
 * @desc    Admin specific document upload
 * @route   POST /admin/documents/upload
 * @access  Private/Admin
 */
export const adminUploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded or file type rejected',
      });
    }

    const file = req.file;
    const ext = path.extname(file.originalname).substring(1).toUpperCase();

    let extractedText = '';
    let status = 'processed';

    try {
      extractedText = await parseDocument(file.path, ext);
    } catch (parseErr) {
      console.error(`[Admin Upload Parsing Error] ${file.originalname}:`, parseErr);
      status = 'failed';
      return res.status(422).json({
        status: 'error',
        message: `Failed to parse document: ${parseErr.message}`,
      });
    }

    // Save metadata associating it with the admin user
    const document = await Document.create({
      name: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      type: ext,
      status: status,
      content: extractedText,
      user: req.user._id,
    });

    return res.status(201).json({
      status: 'success',
      data: document,
    });
  } catch (error) {
    console.error('[Admin Upload Document Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error uploading document metadata',
    });
  }
};
