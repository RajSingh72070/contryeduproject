import api from './api';

const authService = {
  /**
   * Register a new user
   * @param {string} name
   * @param {string} email
   * @param {string} password
   */
  register: async (name, email, password) => {
    const response = await api.post('/register', { name, email, password });
    return response.data; // expects { status: 'success', data: { _id, name, email, role, token } }
  },

  /**
   * Authenticate a user
   * @param {string} email
   * @param {string} password
   */
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data; // expects { status: 'success', data: { _id, name, email, role, token } }
  },

  /**
   * Fetch currently authenticated user profile
   */
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data; // expects { status: 'success', data: { _id, name, email, role, createdAt } }
  },

  updateProfile: async (name, email) => {
    const response = await api.put('/profile', { name, email });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/profile/password', { currentPassword, newPassword });
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default authService;
