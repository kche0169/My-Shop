/**
 * Cart Store
 * 管理购物车状态
 */
import { emitter } from './emitter.js';

class CartStore {
  constructor() {
    this._items = [];
    this._totalCount = 0;
    this._totalPrice = 0;
  }

  setItems(items) {
    this._items = items || [];
    this.recalculate();
    emitter.emit('cart:updated', this.getState());
  }

  addItem(item) {
    const existing = this._items.find(i => i.pid === item.pid);
    if (existing) {
      existing.num += item.num || 1;
    } else {
      this._items.push({ ...item });
    }
    this.recalculate();
    emitter.emit('cart:updated', this.getState());
  }

  removeItem(pid) {
    this._items = this._items.filter(i => i.pid !== pid);
    this.recalculate();
    emitter.emit('cart:updated', this.getState());
  }

  updateItemNum(pid, num) {
    const item = this._items.find(i => i.pid === pid);
    if (item) {
      item.num = num;
      this.recalculate();
      emitter.emit('cart:updated', this.getState());
    }
  }

  clear() {
    this._items = [];
    this._totalCount = 0;
    this._totalPrice = 0;
    emitter.emit('cart:updated', this.getState());
  }

  recalculate() {
    this._totalCount = this._items.reduce((sum, item) => sum + (item.num || 0), 0);
  }

  getState() {
    return {
      items: this._items,
      totalCount: this._totalCount,
      totalPrice: this._totalPrice
    };
  }

  getItems() {
    return [...this._items];
  }

  getTotalCount() {
    return this._totalCount;
  }

  onUpdate(callback) {
    return emitter.on('cart:updated', callback);
  }
}

export const cartStore = new CartStore();
export default cartStore;