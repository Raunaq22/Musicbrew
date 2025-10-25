import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const spotifyToken = localStorage.getItem('spotifyToken');
    if (spotifyToken) {
      config.headers.accesstoken = spotifyToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('spotifyToken');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

export default api;
