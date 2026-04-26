/**
 * User Store
 * 管理用户登录状态和用户信息
 */
import { emitter } from './emitter.js';

const STORAGE_KEY = 'userRole';
const USER_CACHE_KEY = 'cachedUser';

class UserStore {
  constructor() {
    this._user = null;
    this._isLogin = false;
    this._role = 'Guest';
  }

  async fetchUserInfo() {
    try {
      const res = await fetch('/api/userinfo', { cache: 'no-store', credentials: 'include' });
      const data = await res.json();

      this._user = data;
      this._isLogin = data.isLogin || false;
      this._role = data.role || 'Guest';

      if (this._isLogin) {
        localStorage.setItem(STORAGE_KEY, this._role);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USER_CACHE_KEY);
      }

      emitter.emit('user:updated', this.getState());
      return this.getState();
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      const cached = this.getCachedUser();
      if (cached) {
        this._user = cached;
        this._isLogin = cached.isLogin || false;
        this._role = cached.role || 'Guest';
      }
      return this.getState();
    }
  }

  getCachedUser() {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  getState() {
    return {
      user: this._user,
      isLogin: this._isLogin,
      role: this._role
    };
  }

  getRole() {
    return this._role;
  }

  isLogin() {
    return this._isLogin;
  }

  isAdmin() {
    return this._role === 'Admin';
  }

  setRole(role) {
    this._role = role;
    this._isLogin = role !== 'Guest';
    localStorage.setItem(STORAGE_KEY, role);
    emitter.emit('user:updated', this.getState());
  }

  logout() {
    this._user = null;
    this._isLogin = false;
    this._role = 'Guest';
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
    emitter.emit('user:updated', this.getState());
  }

  onUpdate(callback) {
    return emitter.on('user:updated', callback);
  }
}

export const userStore = new UserStore();
export default userStore;