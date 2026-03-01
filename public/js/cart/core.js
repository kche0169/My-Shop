/**
 * Shopping Cart Core Data Layer (OOP design, independent of UI)
 * Responsibility: Data storage, data operations (add/modify/delete/query), localStorage persistence
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
  constructor() {
    // Initialize cart item list (store CartItem instances)
    this.cartItems = [];
  }

  /**
   * 1. Query single product (core method relied on by index.js, previously missing!)
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
  addToCart(pid, num = 1) {
    const validPid = parseInt(pid, 10);
    const validNum = Math.max(parseInt(num, 10), 1);
    const existingItem = this.getCartItem(validPid);

    if (existingItem) {
      // Exists: accumulate quantity
      existingItem.num += validNum;
    } else {
      // Not exists: add new CartItem instance
      this.cartItems.push(new CartItem(validPid, validNum));
    }
  }

  /**
   * 4. Update product quantity
   * @param {number} pid - Product ID
   * @param {number} newNum - New quantity (minimum 1)
   * @returns {boolean} - Return true if updated, false if product not found
   */
  updateNum(pid, newNum) {
    const validPid = parseInt(pid, 10);
    const validNum = Math.max(parseInt(newNum, 10), 1);
    const item = this.getCartItem(validPid);

    if (item) {
      item.num = validNum;
      return true;
    }
    return false;
  }

  /**
   * 5. Remove product from cart
   * @param {number} pid - Product ID
   * @returns {boolean} - Return true if removed, false if product not found
   */
  removeFromCart(pid) {
    const validPid = parseInt(pid, 10);
    const initialLength = this.cartItems.length;
    this.cartItems = this.cartItems.filter(item => item.pid !== validPid);
    return this.cartItems.length < initialLength;
  }

  /**
   * 6. Clear cart
   */
  clearCart() {
    this.cartItems = [];
  }

  /**
   * 7. Get total item count (sum of all product quantities)
   * @returns {number} - Total item count
   */
  getTotalItemCount() {
    return this.cartItems.reduce((total, item) => total + item.num, 0);
  }

  /**
   * 8. Load cart data from localStorage (restore after page refresh)
   */
  loadFromLocalStorage() {
    try {
      // Add: Test localStorage availability first (avoid error from block)
      const testKey = '__cart_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      const storedData = localStorage.getItem('shoppingCart');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Convert to CartItem instances (ensure method callability)
        this.cartItems = parsedData.map(item => new CartItem(item.pid, item.num));
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      this.cartItems = []; // Initialize empty cart when load fails
    }
  }

  /**
   * 9. Save cart data to localStorage (persistence)
   */
  saveToLocalStorage() {
    try {
      // Add: Test localStorage availability first (avoid error from block)
      const testKey = '__cart_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      // Store only necessary data (pid and num) to avoid redundancy
      const dataToStore = this.cartItems.map(item => ({
        pid: item.pid,
        num: item.num
      }));
      localStorage.setItem('shoppingCart', JSON.stringify(dataToStore));
    } catch (error) {
      // Only print warning, do not modify in-memory data (core: cartItems remains)
      console.warn('Failed to save cart to localStorage (blocked by browser)：', error);
    }
  }
}
// Expose class for index.js import (ensure global accessibility)
window.ShoppingCart = ShoppingCart;