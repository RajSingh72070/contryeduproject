import api from './api';

const knowledgeService = {
  /**
   * Trigger reindexing of all processed/unindexed documents
   */
  reindex: async () => {
    const response = await api.post('/knowledge/reindex');
    return response.data; // expects { status: 'success', message, data: { indexedCount, failedCount, failures } }
  },

  /**
   * Retrieve Vector database statistics and status
   */
  getStats: async () => {
    const response = await api.get('/knowledge');
    return response.data; // expects { status: 'success', data: { status, vectorCount, documentsIndexed, documentsTotal } }
  },

  /**
   * De-index a specific document (revert vectors to text only)
   * @param {string} id Document ID
   */
  deindex: async (id) => {
    const response = await api.delete(`/knowledge/${id}`);
    return response.data; // expects { status: 'success', message }
  },
};

export default knowledgeService;
