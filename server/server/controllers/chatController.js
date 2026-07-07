import { queryKnowledgeBase } from '../rag/ragService.js';

// Simple in-memory cache with TTL expiration
const chatCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * @desc    Query document database via RAG and answer support question
 * @route   POST /chat
 * @access  Private
 */
export const queryChat = async (req, res) => {
  try {
    const { message, temperature, modelName, sessionId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a non-empty user question message parameter.',
      });
    }

    const cacheKey = `${req.user._id}-${message}-${modelName || 'default'}-${temperature || 'default'}-${sessionId || 'default'}`;
    const cachedItem = chatCache.get(cacheKey);

    if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_TTL_MS)) {
      console.log(`[Cache Hit] Serving cached answer for query: "${message}"`);
      return res.status(200).json({
        status: 'success',
        data: cachedItem.data,
        cached: true
      });
    }

    // Call queryKnowledgeBase RAG service
    const ragResult = await queryKnowledgeBase(message, req.user._id, {
      temperature,
      modelName,
      sessionId,
    });

    // Cache the result
    chatCache.set(cacheKey, {
      data: ragResult,
      timestamp: Date.now()
    });

    return res.status(200).json({
      status: 'success',
      data: ragResult,
    });
  } catch (error) {
    console.error('[Chat Controller Error]', error);
    
    // Check if it's an OpenAI configuration error specifically
    if (error.message.includes('API Key') || error.message.includes('ApiKey')) {
      return res.status(401).json({
        status: 'error',
        message: 'OpenAI API key configuration is missing or invalid. Verify settings.',
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Failed to process AI chat query request: ' + error.message,
    });
  }
};
