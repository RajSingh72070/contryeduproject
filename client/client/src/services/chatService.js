import api from './api';

const chatService = {
  /**
   * Send question message to vector RAG engine
   * @param {string} message User query question
   * @param {object} options Options like temperature and modelName
   */
  query: async (message, options = {}) => {
    const response = await api.post('/chat', {
      message,
      temperature: options.temperature,
      modelName: options.modelName,
      sessionId: options.sessionId,
    });
    return response.data; // expects { status: 'success', data: { answer, sources: [...], confidence } }
  },

  /**
   * Fetch chat sessions log history
   */
  getHistory: async () => {
    const response = await api.get('/chat/history');
    return response.data; // expects { status: 'success', data: [...] }
  },

  /**
   * Delete specific session ID log history
   */
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/chat/history/${sessionId}`);
    return response.data;
  },

  /**
   * Delete all session logs history
   */
  clearHistory: async () => {
    const response = await api.delete('/chat/history');
    return response.data;
  },
};

export default chatService;
