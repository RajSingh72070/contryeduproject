import api from './api';

const adminService = {
  /**
   * Fetch global metrics (users count, vector chunks count, connection status)
   */
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  /**
   * Get all documents in the system
   * @param {string} search optional filter
   */
  getDocuments: async (search = '') => {
    const response = await api.get(`/admin/documents?search=${encodeURIComponent(search)}`);
    return response.data;
  },

  /**
   * Delete any system document
   * @param {string} id Document ID
   */
  deleteDocument: async (id) => {
    const response = await api.delete(`/admin/documents/${id}`);
    return response.data;
  },

  /**
   * Trigger system-wide batch reindexing
   */
  reindex: async () => {
    const response = await api.post('/admin/reindex');
    return response.data;
  },

  /**
   * Admin-level document upload
   * @param {File} file File payload
   * @param {function} onUploadProgress Axios upload progress callback
   */
  uploadDocument: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/admin/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },
};

export default adminService;
