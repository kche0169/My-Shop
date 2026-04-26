/**
 * Cart API
 * 购物车增删改查
 */
import apiClient from './client.js';

export const cartApi = {
  add: (userid, pid, num) => {
    return apiClient.post('/products/cart/add', { userid, pid, num });
  },

  list: (userid) => {
    return apiClient.post('/products/cart/list', { userid });
  },

  update: (userid, pid, num) => {
    return apiClient.post('/products/cart/update', { userid, pid, num });
  },

  remove: (userid, pid) => {
    return apiClient.post('/products/cart/delete', { userid, pid });
  },

  clear: (userid) => {
    return apiClient.post('/products/cart/clear', { userid });
  }
};