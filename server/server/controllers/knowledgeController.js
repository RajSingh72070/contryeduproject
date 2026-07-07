import {
  indexDocument,
  deleteDocumentEmbeddings,
  getVectorStoreStats,
} from '../rag/ragService.js';
import Document from '../models/Document.js';

/**
 * @desc    Reindex all processed documents into ChromaDB vector store
 * @route   POST /knowledge/reindex
 * @access  Private
 */
export const reindexDocuments = async (req, res) => {
  try {
    // Find all documents for the user that are NOT indexed yet (status: 'processed' or 'uploaded')
    // We prioritize 'processed' documents because they contain extracted text content
    const unindexedDocs = await Document.find({
      user: req.user._id,
      status: 'processed',
    });

    if (unindexedDocs.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No documents need indexing. Ensure files are successfully uploaded and parsed first.',
        data: { indexedCount: 0 },
      });
    }

    let indexedCount = 0;
    const failures = [];

    // Loop and index each document
    for (const doc of unindexedDocs) {
      try {
        await indexDocument(doc, req.user._id);
        indexedCount++;
      } catch (err) {
        console.error(`[Reindex API Error] Failed to index document: ${doc.originalName}`, err);
        failures.push({ name: doc.originalName, error: err.message });
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Reindexing sequence complete. Successfully embedded ${indexedCount} document(s).`,
      data: {
        indexedCount,
        failedCount: failures.length,
        failures,
      },
    });
  } catch (error) {
    console.error('[Reindex Controller Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error triggering document reindexing',
    });
  }
};

/**
 * @desc    Get Knowledge Base / Vector Store statistics
 * @route   GET /knowledge
 * @access  Private
 */
export const getKnowledgeStats = async (req, res) => {
  try {
    const stats = await getVectorStoreStats(req.user._id);
    return res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    console.error('[Stats Controller Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve knowledge base statistics',
    });
  }
};

/**
 * @desc    Deindex a specific document (remove vector store embeddings)
 * @route   DELETE /knowledge/:id
 * @access  Private
 */
export const deindexDocument = async (req, res) => {
  try {
    const documentId = req.params.id;

    // Verify document exists and belongs to request user
    const document = await Document.findOne({ _id: documentId, user: req.user._id });

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found or access unauthorized',
      });
    }

    // Call service to remove from ChromaDB
    await deleteDocumentEmbeddings(documentId);

    // Update MongoDB document status back to 'processed'
    document.status = 'processed';
    await document.save();

    return res.status(200).json({
      status: 'success',
      message: 'Document embeddings successfully deleted from ChromaDB. Status reverted to processed.',
    });
  } catch (error) {
    console.error('[Deindex Controller Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to deindex document',
    });
  }
};
