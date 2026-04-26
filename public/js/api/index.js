/**
 * API Client Configuration
 * 统一管理 axios 实例和默认配置
 */
(function(global) {
  'use strict';

  const apiClient = axios.create({
    baseURL: AppConfig.API_BASE_URL || '/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  apiClient.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
      console.error('API Error:', error);
      return Promise.reject(error);
    }
  );

  const authApi = {
    login: (email, password) => apiClient.post('/login', { email, password }),
    register: (email, password) => apiClient.post('/register', { email, password }),
    logout: () => apiClient.get('/logout'),
    getUserInfo: () => apiClient.get('/userinfo'),
    changePassword: (currentPassword, newPassword) =>
      apiClient.post('/change-password', { currentPassword, newPassword })
  };

  const productApi = {
    list: (catid) => {
      const url = catid ? `/products/list?catid=${catid}` : '/products/list';
      return apiClient.get(url);
    },
    detail: (pid) => apiClient.get(`/products/detail?pid=${pid}`),
    add: (formData) => apiClient.post('/products/add', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    edit: (formData) => apiClient.post('/products/edit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (pid) => apiClient.get(`/products/del/${pid}`)
  };

  const categoryApi = {
    getAll: () => apiClient.get('/cate/all'),
    add: (name) => apiClient.post('/cate/add', { name }),
    edit: (catid, name) => apiClient.post('/cate/edit', { catid, name }),
    delete: (catid) => apiClient.get(`/cate/del/${catid}`)
  };

  const cartApi = {
    add: (userid, pid, num) => apiClient.post('/products/cart/add', { userid, pid, num }),
    list: (userid) => apiClient.post('/products/cart/list', { userid }),
    update: (userid, pid, num) => apiClient.post('/products/cart/update', { userid, pid, num }),
    remove: (userid, pid) => apiClient.post('/products/cart/delete', { userid, pid }),
    clear: (userid) => apiClient.post('/products/cart/clear', { userid })
  };

  const orderApi = {
    create: (userid, items) => apiClient.post('/orders/create', { userid, items }),
    getUserRecent: () => apiClient.get('/orders/user/recent'),
    getAdminAll: () => apiClient.get('/orders/admin/all')
  };

  const API = {
    client: apiClient,
    auth: authApi,
    product: productApi,
    category: categoryApi,
    cart: cartApi,
    order: orderApi
  };

  global.API = API;

})(window);