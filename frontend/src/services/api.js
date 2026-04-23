import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jkmall_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally (only redirect for protected pages)
const publicPaths = ['/', '/login', '/register', '/product'];
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isPublicPage = publicPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith('/product/'));
      if (!isPublicPage) {
        localStorage.removeItem('jkmall_token');
        localStorage.removeItem('jkmall_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Products ──
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  create: (data) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/products/${id}`),
};

// ── Orders ──
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getMy: (params) => api.get('/orders/my', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, data) => api.patch(`/orders/${id}/status`, data),
};

// ── M-Pesa ──
export const mpesaAPI = {
  stkPush: (data) => api.post('/mpesa/stk-push', data),
  checkStatus: (checkoutId) => api.get(`/mpesa/status/${checkoutId}`),
};

// ── Deliveries ──
export const deliveriesAPI = {
  get: (orderId) => api.get(`/deliveries/${orderId}`),
  assign: (data) => api.post('/deliveries', data),
  updateLocation: (id, data) => api.patch(`/deliveries/${id}/location`, data),
  getRiderDeliveries: () => api.get('/deliveries/rider/my'),
};

// ── Admin ──
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
};

export default api;
