/**
 * Cart Module Entry Point
 * 购物车模块入口 - 整合渲染和事件
 */
import { CartRenderer } from './renderer.js';
import { CartEvents } from './events.js';

window.productCache = window.productCache || new Map();

window.AppUtils = window.AppUtils || {
  formatPrice: function(price) {
    const num = parseFloat(price) || 0;
    return `$${num.toFixed(2)}`;
  }
};

window.AppConfig = window.AppConfig || {
  API_BASE_URL: '/api',
  DEFAULT_IMG: 'https://via.placeholder.com/200x200?text=No+Image'
};

window.cartInitialized = false;
window.cartEventsInitialized = false;
window.cart = window.cart || null;

const renderer = new CartRenderer();
const eventsHandler = new CartEvents();

function getCurrentUserId() {
  const storedId = localStorage.getItem('current_userid');
  return storedId ? parseInt(storedId, 10) : 1;
}

async function initCartGlobal() {
  try {
    if (typeof ShoppingCart !== 'function') {
      throw new Error('ShoppingCart class not found! Please load cart/core.js first.');
    }

    if (!window.cart) {
      const userid = getCurrentUserId();
      console.log('[initCartGlobal] Initializing cart with userid:', userid);
      window.cart = new ShoppingCart(userid);
    }

    await window.cart.load();

    if (!window.cartEventsInitialized) {
      eventsHandler.setCart(window.cart);
      eventsHandler.init();
      window.cartEventsInitialized = true;
    }

    await renderer.renderPopup(window.cart);
    if (document.getElementById('cart-items')) {
      await renderer.renderPage(window.cart);
    }

    window.cartInitialized = true;
    console.log('[initCartGlobal] Cart initialized successfully, item count:', window.cart.getTotalItemCount());
  } catch (error) {
    console.error('[initCartGlobal] Cart initialization failed:', error);
    alert('Cart initialization failed: ' + error.message);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.cartInitialized) {
    await initCartGlobal();
  }
});

window.addEventListener('pageshow', async () => {
  if (window.cart && window.cartInitialized) {
    await renderer.renderPopup(window.cart);
    if (document.getElementById('cart-items')) await renderer.renderPage(window.cart);
  } else if (!window.cartInitialized) {
    await initCartGlobal();
  }
});

window.addToCart = async function(pid, e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  console.log('[Add to Cart] Received PID:', pid);
  const validPid = parseInt(pid) || 0;

  if (!window.cart) {
    console.log('[Add to Cart] Cart not initialized, initializing...');
    await initCartGlobal();
  }

  if (validPid <= 0) {
    alert('Invalid product ID');
    return;
  }

  try {
    let product = null;
    if (window.productCache.has(validPid)) {
      product = window.productCache.get(validPid);
    } else {
      const res = await axios.get(`${window.AppConfig.API_BASE_URL}/products/detail?pid=${validPid}`);
      if (!res.data || !res.data.data) {
        alert('Product not found');
        return;
      }
      product = res.data.data;
      window.productCache.set(validPid, product);
    }

    await window.cart.addToCart(validPid, 1);

    await renderer.renderPopup(window.cart);
    if (document.getElementById('cart-items')) await renderer.renderPage(window.cart);

    alert(`${product.name || `Product #${validPid}`} added to cart!`);

    const cartPopup = document.getElementById('cart-popup');
    if (cartPopup) {
      cartPopup.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      cartPopup.classList.add('opacity-100', 'pointer-events-auto');
    }
  } catch (error) {
    console.error('[Add to Cart] Failed:', error);
    alert('Failed to add product to cart: ' + error.message);
  }
};

export { renderer, eventsHandler };