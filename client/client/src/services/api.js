import axios from 'axios';

// Create central Axios instance
const api = axios.create({
  baseURL: '/api', // Proxy in vite.config.js redirects this to http://localhost:5001/api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token into requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global errors (e.g. 401 Unauthorized redirect or logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user details if unauthorized/expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Option: redirect to /login or dispatch event
    }
    return Promise.reject(error);
  }
);

export default api;
