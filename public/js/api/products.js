/**
 * Products API
 * 商品列表、详情、增删改
 */
import apiClient from './client.js';

export const productApi = {
  list: (catid) => {
    const url = catid ? `/products/list?catid=${catid}` : '/products/list';
    return apiClient.get(url);
  },

  detail: (pid) => {
    return apiClient.get(`/products/detail?pid=${pid}`);
  },

  add: (formData) => {
    return apiClient.post('/products/add', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  edit: (formData) => {
    return apiClient.post('/products/edit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  delete: (pid) => {
    return apiClient.get(`/products/del/${pid}`);
  }
};