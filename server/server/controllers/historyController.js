import ChatHistory from '../models/ChatHistory.js';

/**
 * @desc    Get unique chat session list grouped by sessionId
 * @route   GET /chat/history
 * @access  Private
 */
export const getChatHistory = async (req, res) => {
  try {
    const sessions = await ChatHistory.aggregate([
      { $match: { user: req.user._id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$sessionId',
          topic: { $first: '$question' },
          date: { $first: '$createdAt' },
          messagesCount: { $sum: 2 }, // 2 messages per turn: User question + AI Answer
        },
      },
      { $sort: { date: -1 } },
    ]);

    // Format response to match frontend expects
    const formattedSessions = sessions.map((sess) => ({
      id: sess._id,
      topic: sess.topic,
      date: new Date(sess.date).toLocaleString(),
      messages: sess.messagesCount,
      model: 'GPT-4o-mini',
      category: 'RAG Operator',
    }));

    return res.status(200).json({
      status: 'success',
      data: formattedSessions,
    });
  } catch (error) {
    console.error('[History Controller Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve session histories',
    });
  }
};

/**
 * @desc    Clear all chat histories or a specific sessionId
 * @route   DELETE /chat/history
 * @route   DELETE /chat/history/:sessionId
 * @access  Private
 */
export const clearChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (sessionId) {
      // Clear specific session
      await ChatHistory.deleteMany({ user: req.user._id, sessionId });
      return res.status(200).json({
        status: 'success',
        message: `Chat session ${sessionId} deleted successfully`,
      });
    } else {
      // Clear all user sessions
      await ChatHistory.deleteMany({ user: req.user._id });
      return res.status(200).json({
        status: 'success',
        message: 'All conversation histories cleared successfully',
      });
    }
  } catch (error) {
    console.error('[Clear History Controller Error]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to clear conversation histories',
    });
  }
};
