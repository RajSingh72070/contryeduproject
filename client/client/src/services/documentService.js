import api from './api';

const documentService = {
  /**
   * Upload a single document
   * @param {File} file
   * @param {Function} onProgress callback tracking percentage (0-100)
   */
  uploadDocument: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      },
    });

    return response.data; // expects { status: 'success', data: Document }
  },

  /**
   * Retrieve all documents from Knowledge Base
   */
  getDocuments: async () => {
    const response = await api.get('/documents');
    return response.data; // expects { status: 'success', count, data: Document[] }
  },

  /**
   * Delete a document by ID
   * @param {string} id
   */
  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data; // expects { status: 'success', message }
  },
};

export default documentService;
