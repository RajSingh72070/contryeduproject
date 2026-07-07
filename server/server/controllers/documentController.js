import fs from 'fs';
import path from 'path';
import Document from '../models/Document.js';
import { parseDocument } from '../services/documentParser.js';
import { deleteDocumentEmbeddings } from '../rag/ragService.js';

/**
 * @desc    Upload and parse a document
 * @route   POST /documents/upload
 * @access  Private
 */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded or file rejected by storage policy',
      });
    }

    const file = req.file;
    const ext = path.extname(file.originalname).substring(1).toUpperCase(); // e.g. PDF, DOCX, TXT

    let extractedText = '';
    let status = 'processed';

    try {
      // Parse file contents using documentParser service
      extractedText = await parseDocument(file.path, ext);
    } catch (parseErr) {
      console.error(`[Upload Controller Parsing Error] File: ${file.originalname}:`, parseErr);
      status = 'failed';
      // We will still create the DB record but mark it as failed upload, or reject it.
      // The user wants us to process files, so if it fails, returning 422 Unprocessable is best.
      return res.status(422).json({
        status: 'error',
        message: `Failed to parse document content: ${parseErr.message}`,
      });
    }

    // Create database document record with clean content text
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
      data: document, // includes "content" which is the extracted text
    });
  } catch (error) {
    console.error('[Upload Controller Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process document upload and parsing',
    });
  }
};

/**
 * @desc    Get all user documents
 * @route   GET /documents
 * @access  Private
 */
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error('[Get Documents Controller Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve indexed documents',
    });
  }
};

/**
 * @desc    Delete a document
 * @route   DELETE /documents/:id
 * @access  Private
 */
export const deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.id;

    // Locate document and verify owner user
    const document = await Document.findOne({ _id: documentId, user: req.user._id });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found or access unauthorized',
      });
    }

    // Try deleting physical file from disk
    try {
      if (fs.existsSync(document.path)) {
        await fs.promises.unlink(document.path);
        console.log(`[SupportGPT File] Physically deleted file: ${document.path}`);
      } else {
        console.warn(`[SupportGPT File Warning] File not found on disk at: ${document.path}`);
      }
    } catch (fsErr) {
      console.error(`[SupportGPT File Error] Failed to delete file at ${document.path}:`, fsErr);
      // We will still proceed to delete the DB record so the system doesn't get locked up
    }

    // Try deleting vector embeddings from ChromaDB
    try {
      await deleteDocumentEmbeddings(documentId);
    } catch (vectorErr) {
      console.error(`[SupportGPT RAG Warning] Failed to delete embeddings for doc ${documentId}:`, vectorErr);
      // Proceed with DB record deletion anyway
    }

    // Delete database record
    await Document.deleteOne({ _id: documentId });

    return res.status(200).json({
      status: 'success',
      message: 'Document removed successfully',
    });
  } catch (error) {
    console.error('[Delete Controller Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete document',
    });
  }
};
