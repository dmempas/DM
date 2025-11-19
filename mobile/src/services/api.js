import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://your-production-api.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage and redirect to login
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // You might want to navigate to login screen here
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (userData) => apiClient.post('/auth/register', userData),
  refreshToken: () => apiClient.post('/auth/refresh-token'),
};

// Items APIs
export const itemsAPI = {
  getItems: (params) => apiClient.get('/items', { params }),
  getItem: (id) => apiClient.get(`/items/${id}`),
  createItem: (itemData) => apiClient.post('/items', itemData),
  updateItem: (id, itemData) => apiClient.put(`/items/${id}`, itemData),
  deleteItem: (id) => apiClient.delete(`/items/${id}`),
  searchItems: (query) => apiClient.get('/items/search', { params: { q: query } }),
};

// Claims APIs
export const claimsAPI = {
  createClaim: (claimData) => apiClient.post('/claims', claimData),
  getMyClaims: () => apiClient.get('/claims/my-claims'),
  updateClaim: (id, claimData) => apiClient.put(`/claims/${id}`, claimData),
  getClaimVerification: (itemId) => apiClient.get(`/claims/verification/${itemId}`),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getItems: (params) => apiClient.get('/admin/items', { params }),
  approveClaim: (claimId) => apiClient.put(`/admin/claims/${claimId}/approve`),
  rejectClaim: (claimId, reason) => apiClient.put(`/admin/claims/${claimId}/reject`, { reason }),
  removeItem: (itemId, reason) => apiClient.delete(`/admin/items/${itemId}`, { data: { reason } }),
  suspendUser: (userId, reason) => apiClient.put(`/admin/users/${userId}/suspend`, { reason }),
};

// Notifications APIs
export const notificationsAPI = {
  getNotifications: () => apiClient.get('/notifications'),
  markAsRead: (notificationId) => apiClient.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
};

// Matching APIs
export const matchingAPI = {
  findMatches: (itemId) => apiClient.get(`/matching/find-matches/${itemId}`),
  checkForNewMatches: () => apiClient.get('/matching/check-new-matches'),
};

// File Upload API
export const uploadAPI = {
  uploadImage: (formData) => apiClient.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default apiClient;