/**
 * Authentication API
 * 登录、注册、登出、用户信息
 */
import apiClient from './client.js';

export const authApi = {
  login: (email, password) => {
    return apiClient.post('/login', { email, password });
  },

  register: (email, password) => {
    return apiClient.post('/register', { email, password });
  },

  logout: () => {
    return apiClient.get('/logout');
  },

  getUserInfo: () => {
    return apiClient.get('/userinfo');
  },

  changePassword: (currentPassword, newPassword) => {
    return apiClient.post('/change-password', { currentPassword, newPassword });
  }
};