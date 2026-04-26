/**
 * Cart Events
 * 购物车交互事件处理
 */
import cartRenderer from './renderer.js';

export class CartEvents {
  constructor() {
    this.cart = null;
    this.renderer = cartRenderer;
  }

  setCart(cart) {
    this.cart = cart;
  }

  init() {
    this.initPopupControl();
    this.initQuantityEvents();
    this.initDeleteEvents();
    this.initClearCart();
  }

  initPopupControl() {
    const cartEntry = document.getElementById('cart-entry');
    const cartPopup = document.getElementById('cart-popup');
    if (!cartEntry || !cartPopup) return;

    let isPopupOpen = false;
    let hoverCloseTimer = null;
    const HOVER_DELAY = 300;

    const openPopup = () => {
      clearTimeout(hoverCloseTimer);
      cartPopup.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      cartPopup.classList.add('opacity-100', 'pointer-events-auto');
      isPopupOpen = true;
      this.renderer.renderPopup(this.cart).catch(err => console.error('Failed to render popup:', err));
    };

    const closePopup = () => {
      clearTimeout(hoverCloseTimer);
      cartPopup.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      cartPopup.classList.remove('opacity-100', 'pointer-events-auto');
      isPopupOpen = false;
    };

    cartEntry.addEventListener('mouseenter', () => {
      if (!isPopupOpen) openPopup();
    });

    cartEntry.addEventListener('mouseleave', () => {
      if (!isPopupOpen) {
        hoverCloseTimer = setTimeout(closePopup, HOVER_DELAY);
      }
    });

    cartEntry.addEventListener('click', (e) => {
      const isControlBtn = e.target.closest('.cart-qty-minus, .cart-qty-plus, .cart-qty-input, .cart-item-delete');
      if (!isControlBtn) {
        isPopupOpen ? closePopup() : openPopup();
      }
    });

    const closeBtn = cartPopup.querySelector('.cart-popup-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closePopup();
      });
    }

    document.addEventListener('click', (e) => {
      if (isPopupOpen && !cartPopup.contains(e.target) && !cartEntry.contains(e.target)) {
        closePopup();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isPopupOpen) {
        closePopup();
      }
    });

    cartPopup.addEventListener('mouseenter', () => {
      clearTimeout(hoverCloseTimer);
    });
    cartPopup.addEventListener('mouseleave', () => {
      if (!isPopupOpen) {
        hoverCloseTimer = setTimeout(closePopup, HOVER_DELAY);
      }
    });
  }

  initQuantityEvents() {
    document.addEventListener('click', async (e) => {
      const plusBtn = e.target.closest('.cart-plus, .cart-qty-plus');
      const minusBtn = e.target.closest('.cart-minus, .cart-qty-minus');

      if (plusBtn) {
        await this.handleQuantityChange(plusBtn, 1);
      } else if (minusBtn) {
        await this.handleQuantityChange(minusBtn, -1);
      }
    });

    document.addEventListener('input', async (e) => {
      if (!e.target.classList.contains('cart-num') && !e.target.classList.contains('cart-qty-input')) return;
      await this.handleQuantityInput(e.target);
    });
  }

  async handleQuantityChange(btn, delta) {
    const pid = parseInt(btn.dataset.pid);
    if (isNaN(pid)) return;

    const currentItem = this.cart.getCartItem(pid);
    if (!currentItem) return;

    if (delta < 0 && currentItem.num <= 1) return;

    try {
      await this.cart.updateNum(pid, currentItem.num + delta);
      await this.renderer.renderPopup(this.cart);
      if (document.getElementById('cart-items')) await this.renderer.renderPage(this.cart);
    } catch (error) {
      console.error('Failed to change quantity:', error);
      alert('Failed to update quantity: ' + error.message);
    }
  }

  async handleQuantityInput(input) {
    const pid = parseInt(input.dataset.pid);
    const newNum = Math.max(1, parseInt(input.value) || 1);
    if (isNaN(pid)) return;

    const currentItem = this.cart.getCartItem(pid);
    if (!currentItem) return;

    try {
      await this.cart.updateNum(pid, newNum);
      await this.renderer.renderPopup(this.cart);
      if (document.getElementById('cart-items')) await this.renderer.renderPage(this.cart);
    } catch (error) {
      console.error('Failed to update quantity via input:', error);
      alert('Failed to update quantity: ' + error.message);
    }
  }

  initDeleteEvents() {
    document.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.cart-item-delete, .cart-delete');
      if (!deleteBtn) return;

      e.stopPropagation();
      const pid = parseInt(deleteBtn.dataset.pid);
      if (isNaN(pid) || pid <= 0) {
        alert('Invalid product ID');
        return;
      }

      if (!confirm('Are you sure you want to remove this item?')) return;

      try {
        const deleteSuccess = await this.cart.removeFromCart(pid);
        if (!deleteSuccess) {
          alert('Product not in cart');
          return;
        }

        window.productCache.delete(pid);
        await this.renderer.renderPopup(this.cart);
        if (document.getElementById('cart-items')) await this.renderer.renderPage(this.cart);
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Failed to delete product: ' + error.message);
      }
    });
  }

  initClearCart() {
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to clear your cart?')) return;

        try {
          await this.cart.clearCart();
          window.productCache.clear();
          await this.renderer.renderPopup(this.cart);
          if (document.getElementById('cart-items')) await this.renderer.renderPage(this.cart);

          const cartPopup = document.getElementById('cart-popup');
          if (cartPopup) {
            cartPopup.classList.add('hidden', 'opacity-0', 'pointer-events-none');
          }
        } catch (error) {
          console.error('Failed to clear cart:', error);
          alert('Failed to clear cart: ' + error.message);
        }
      });
    }
  }
}

export default new CartEvents();