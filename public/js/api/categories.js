/**
 * Categories API
 * 分类列表、增删改
 */
import apiClient from './client.js';

export const categoryApi = {
  getAll: () => {
    return apiClient.get('/cate/all');
  },

  add: (name) => {
    return apiClient.post('/cate/add', { name });
  },

  edit: (catid, name) => {
    return apiClient.post('/cate/edit', { catid, name });
  },

  delete: (catid) => {
    return apiClient.get(`/cate/del/${catid}`);
  }
};