/**
 * 购物车核心数据层（OOP设计，独立于UI）
 * 职责：数据存储、数据操作（添加/修改/删除/查询）、localStorage持久化
 */
class CartItem {
  /**
   * 单个商品实例
   * @param {number} pid - 商品ID
   * @param {number} num - 商品数量（默认1）
   */
  constructor(pid, num = 1) {
    this.pid = parseInt(pid, 10); // 强制转为数字，避免字符串ID问题
    this.num = Math.max(parseInt(num, 10), 1); // 数量最小为1
  }
}

class ShoppingCart {
  constructor() {
    // 初始化购物车商品列表（存储CartItem实例）
    this.cartItems = [];
  }

  /**
   * 1. 查询单个商品（index.js依赖的核心方法，之前缺失！）
   * @param {number} pid - 商品ID
   * @returns {CartItem|null} - 商品实例或null（未找到）
   */
  getCartItem(pid) {
    const validPid = parseInt(pid, 10);
    return this.cartItems.find(item => item.pid === validPid) || null;
  }

  /**
   * 2. 查询所有商品
   * @returns {CartItem[]} - 购物车所有商品实例
   */
  getCartItems() {
    return [...this.cartItems]; // 返回副本，避免直接修改原数组
  }

  /**
   * 3. 添加商品（已存在则数量累加，不存在则新增）
   * @param {number} pid - 商品ID
   * @param {number} num - 新增数量
   */
  addToCart(pid, num = 1) {
    const validPid = parseInt(pid, 10);
    const validNum = Math.max(parseInt(num, 10), 1);
    const existingItem = this.getCartItem(validPid);

    if (existingItem) {
      // 已存在：累加数量
      existingItem.num += validNum;
    } else {
      // 不存在：新增CartItem实例
      this.cartItems.push(new CartItem(validPid, validNum));
    }
  }

  /**
   * 4. 更新商品数量
   * @param {number} pid - 商品ID
   * @param {number} newNum - 新数量（最小为1）
   * @returns {boolean} - 更新成功返回true，商品不存在返回false
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
   * 5. 从购物车移除商品
   * @param {number} pid - 商品ID
   * @returns {boolean} - 移除成功返回true，商品不存在返回false
   */
  removeFromCart(pid) {
    const validPid = parseInt(pid, 10);
    const initialLength = this.cartItems.length;
    this.cartItems = this.cartItems.filter(item => item.pid !== validPid);
    return this.cartItems.length < initialLength;
  }

  /**
   * 6. 清空购物车
   */
  clearCart() {
    this.cartItems = [];
  }

  /**
   * 7. 获取购物车商品总数（所有商品数量累加）
   * @returns {number} - 商品总数
   */
  getTotalItemCount() {
    return this.cartItems.reduce((total, item) => total + item.num, 0);
  }

  /**
   * 8. 从localStorage加载购物车数据（页面刷新后恢复）
   */
  loadFromLocalStorage() {
    try {
      // 新增：先测试localStorage是否可用（避免阻止导致报错）
      const testKey = '__cart_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      const storedData = localStorage.getItem('shoppingCart');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // 转换为CartItem实例（确保方法可调用）
        this.cartItems = parsedData.map(item => new CartItem(item.pid, item.num));
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      this.cartItems = []; // 加载失败时初始化空购物车
    }
  }

  /**
   * 9. 保存购物车数据到localStorage（持久化）
   */
  saveToLocalStorage() {
    try {
      // 新增：先测试localStorage是否可用（避免阻止导致报错）
      const testKey = '__cart_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      // 只存储必要数据（pid和num），避免冗余
      const dataToStore = this.cartItems.map(item => ({
        pid: item.pid,
        num: item.num
      }));
      localStorage.setItem('shoppingCart', JSON.stringify(dataToStore));
    } catch (error) {
      // 仅打印警告，不修改内存数据（核心：cartItems仍保留）
      console.warn('Failed to save cart to localStorage (浏览器阻止存储)：', error);
    }
  }
}
// 暴露类供index.js引入（确保全局可访问）
window.ShoppingCart = ShoppingCart;