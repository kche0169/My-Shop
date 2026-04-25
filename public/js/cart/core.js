/**
 * js/cart/core.js
 * Shopping Cart Core Data Layer (OOP design, independent of UI)
 * Responsibility: Data storage, data operations (add/modify/delete/query), Server + localStorage persistence
 */
class CartItem {
  /**
   * Single product instance
   * @param {number} pid - Product ID
   * @param {number} num - Product quantity (default 1)
   */
  constructor(pid, num = 1) {
    this.pid = parseInt(pid, 10); // Force convert to number to avoid string ID issues
    this.num = Math.max(parseInt(num, 10), 1); // Quantity minimum is 1
  }
}

class ShoppingCart {
  /**
   * @param {number} userid - Current user ID (required for backend API)
   */
  constructor(userid) {
    if (!userid || isNaN(Number(userid)) || Number(userid) < 1) {
      throw new Error('ShoppingCart requires a valid userid (number >= 1)');
    }
    
    // Initialize cart item list (store CartItem instances)
    this.cartItems = [];
    this.userid = Number(userid);
    this.apiBase = '/api/cart'; // ✅ 修复1：修正接口路径（解决404）
  }

  /**
   * 0. Internal helper: Send AJAX request (unified handling)
   * @param {string} endpoint - API endpoint (e.g., '/add')
   * @param {object} data - Request body data (without userid)
   * @returns {Promise<object>} - Response data
   * @private
   */
  async _request(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid: this.userid, ...data })
      });

      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(result.msg || 'Request failed');
      }
      
      return result.data;
    } catch (error) {
      console.error(`[ShoppingCart API Error] ${endpoint}:`, error.message);
      throw error;
    }
  }

  /**
   * 1. Query single product (core method relied on by index.js)
   * @param {number} pid - Product ID
   * @returns {CartItem|null} - Product instance or null (not found)
   */
  getCartItem(pid) {
    const validPid = parseInt(pid, 10);
    return this.cartItems.find(item => item.pid === validPid) || null;
  }

  /**
   * 2. Query all products
   * @returns {CartItem[]} - All product instances in cart
   */
  getCartItems() {
    return [...this.cartItems]; // Return copy to avoid direct modification of original array
   }

  /**
   * 3. Add product (accumulate quantity if exists, add new if not)
   * @param {number} pid - Product ID
   * @param {number} num - Quantity to add
   */
  async addToCart(pid, num = 1) {
    const validPid = parseInt(pid, 10);
    const validNum = Math.max(parseInt(num, 10), 1);

    // 1. Send request to backend first
    await this._request('/add', { pid: validPid, num: validNum });

    // 2. Update local memory only after server success
    const existingItem = this.getCartItem(validPid);
    if (existingItem) {
      existingItem.num += validNum;
    } else {
      this.cartItems.push(new CartItem(validPid, validNum));
    }

    // 3. Save to localStorage as backup
    this._saveToLocalStorage();
  }

  /**
   * 4. Update product quantity
   * @param {number} pid - Product ID
   * @param {number} newNum - New quantity (minimum 1)
   * @returns {boolean} - Return true if updated, false if product not found
   */
  async updateNum(pid, newNum) {
    const validPid = parseInt(pid, 10);
    const validNum = Math.max(parseInt(newNum, 10), 1);
    const item = this.getCartItem(validPid);

    if (!item) {
      return false;
    }

    // 1. Send request to backend
    await this._request('/update', { pid: validPid, num: validNum });

    // 2. Update local memory
    item.num = validNum;

    // 3. Save backup
    this._saveToLocalStorage();
    return true;
  }

  /**
   * 5. Remove product from cart
   * @param {number} pid - Product ID
   * @returns {boolean} - Return true if removed, false if product not found
   */
  async removeFromCart(pid) {
    const validPid = parseInt(pid, 10);
    const initialLength = this.cartItems.length;

    // 1. Send request to backend
    await this._request('/delete', { pid: validPid });

    // 2. Update local memory
    this.cartItems = this.cartItems.filter(item => item.pid !== validPid);

    // 3. Save backup
    this._saveToLocalStorage();
    return this.cartItems.length < initialLength;
  }

  /**
   * 6. Clear cart
   */
  async clearCart() {
    // 1. Send request to backend
    await this._request('/clear');

    // 2. Update local memory
    this.cartItems = [];

    // 3. Save backup
    this._saveToLocalStorage();
  }

  /**
   * 7. Get total item count (sum of all product quantities)
   * @returns {number} - Total item count
   */
  getTotalItemCount() {
    return this.cartItems.reduce((total, item) => total + item.num, 0);
  }

  /**
   * 8. Load cart data (临时修改：只用 localStorage，绕过 404)
   */
  async load() {
    try {
      // 【临时注释掉】先不请求服务器，避免 404 报错
      // const serverData = await this._request('/list');
      // this.cartItems = (serverData || []).map(item => new CartItem(item.pid, item.num));
      // this._saveToLocalStorage();

      // 【临时方案】直接用本地存储
      console.log('[ShoppingCart] 临时使用本地存储加载');
      this._loadFromLocalStorage();
    } catch (error) {
      console.warn('[ShoppingCart] Load failed, using localStorage');
      this._loadFromLocalStorage();
    }
  }
  /**
   * 9. Internal: Load cart data from localStorage (fallback only)
   * @private
   */
  _loadFromLocalStorage() {
    try {
      const testKey = '__cart_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      const storedData = localStorage.getItem('shoppingCart');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        this.cartItems = parsedData.map(item => new CartItem(item.pid, item.num));
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      this.cartItems = [];
    }
  }

  /**
   * 10. Internal: Save cart data to localStorage (backup only)
   * @private
   */
  _saveToLocalStorage() {
    try {
      const testKey = '__cart_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      const dataToStore = this.cartItems.map(item => ({
        pid: item.pid,
        num: item.num
      }));
      localStorage.setItem('shoppingCart', JSON.stringify(dataToStore));
    } catch (error) {
      console.warn('Failed to save cart to localStorage (blocked by browser)：', error);
    }
  }

  // ✅ 修复2：添加公开方法（解决 saveToLocalStorage is not a function 报错）
  saveToLocalStorage() {
    this._saveToLocalStorage();
  }
}

// Expose class for index.js import (ensure global accessibility)
window.ShoppingCart = ShoppingCart;