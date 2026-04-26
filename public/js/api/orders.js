/**
 * Orders API
 * 订单创建、查询
 */
import apiClient from './client.js';

export const orderApi = {
  create: (userid, items) => {
    return apiClient.post('/orders/create', { userid, items });
  },

  getUserRecent: () => {
    return apiClient.get('/orders/user/recent');
  },

  getAdminAll: () => {
    return apiClient.get('/orders/admin/all');
  }
};