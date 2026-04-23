// ========== Global Constants & Utility Functions (Fix: Global Mount + Fallback) ==========
// 1. Global product cache (shared across all pages, fix local cache issue)
// public/js/index.js

window.productCache = window.productCache || new Map();

// 2. Global dependency fallback (solve AppUtils/AppConfig late loading issue on product page)
window.AppUtils = window.AppUtils || {
  formatPrice: function(price) {
    const num = parseFloat(price) || 0;
    return `$${num.toFixed(2)}`;
  }
};

window.AppConfig = window.AppConfig || {
  // API_BASE_URL: 'http://localhost:3000/api',
  API_BASE_URL: '/api',
  DEFAULT_IMG: 'https://via.placeholder.com/200x200?text=No+Image'
};

// 3. Global state flags (prevent duplicate initialization/event binding)
window.cartInitialized = false;      // Whether cart is initialized
window.cartEventsInitialized = false;// Whether cart events are bound

// ========== Global Cart Instance Initialization (Core Fix: UserID + Async Load) ==========
// Global cart instance (fix local variable issue, accessible to all pages)
window.cart = window.cart || null;

// TODO: Replace this with your actual user ID retrieval logic (e.g., from login session/JWT)
function getCurrentUserId() {
  // Example: Try to get from localStorage, default to 1 for demo
  const storedId = localStorage.getItem('current_userid');
  return storedId ? parseInt(storedId, 10) : 1;
}

async function initCartGlobal() {
  try {
    // Fix 1: Validate if ShoppingCart class exists
    if (typeof ShoppingCart !== 'function') {
      throw new Error('ShoppingCart class not found! Please load cart/core.js first.');
    }

    // Initialize global cart instance (create only once)
    if (!window.cart) {
      const userid = getCurrentUserId();
      console.log('[initCartGlobal] Initializing cart with userid:', userid);
      window.cart = new ShoppingCart(userid);
    }

    // Fix 2: Async load from server (with localStorage fallback)
    await window.cart.load();

    // Fix 3: Bind events only once
    if (!window.cartEventsInitialized) {
      initCartEvents();
      window.cartEventsInitialized = true;
    }

    // Render cart
    await renderCartPopup(window.cart);
    if (document.getElementById('cart-items')) {
      await renderCartUI(window.cart);
    }

    window.cartInitialized = true;
    console.log('[initCartGlobal] Cart initialized successfully, item count:', window.cart.getTotalItemCount());
  } catch (error) {
    console.error('[initCartGlobal] Cart initialization failed:', error);
    alert('Cart initialization failed: ' + error.message);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.cartInitialized) {
    await initCartGlobal();
  }
});

// Only re-render on page back/refresh
window.addEventListener('pageshow', async () => {
  if (window.cart && window.cartInitialized) {
    await renderCartPopup(window.cart);
    if (document.getElementById('cart-items')) await renderCartUI(window.cart);
  } else if (!window.cartInitialized) {
    await initCartGlobal();
  }
});

function initCartPopupControl() {
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
    renderCartPopup(window.cart).catch(err => console.error('Failed to render popup:', err));
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

// ========== 2. Popup UI Rendering (Core Fix: Remove direct items access) ==========
async function renderCartPopup(cart) {
  const popupItems = document.getElementById('cart-popup-items');
  const popupTotal = document.getElementById('cart-popup-total');
  const cartCount = document.getElementById('cart-count');
  const cartTitle = document.getElementById('cart-popup-title');

  if (!popupItems || !popupTotal || !cartCount) {
    console.warn('Cart popup core DOM missing');
    return;
  }

  // Fix 4: Use getCartItems() instead of direct access
  const cartItems = Array.isArray(cart.getCartItems()) ? cart.getCartItems() : [];
  const totalItemCount = cartItems.reduce((sum, item) => sum + (item.num || 0), 0);

  cartCount.textContent = totalItemCount;
  if (cartTitle) cartTitle.textContent = `Your Cart (${totalItemCount} items)`;

  if (totalItemCount === 0) {
    popupItems.innerHTML = `
      <div class="text-center text-gray-500 py-6">
        <i class="fa-solid fa-cart-shopping text-3xl mb-2"></i>
        <p>Your cart is empty</p>
      </div>
    `;
    popupTotal.textContent = AppUtils.formatPrice(0);
    return;
  }

  popupItems.innerHTML = '';
  const itemTemplate = document.querySelector('.cart-item-template');
  const validCartItems = cartItems.filter(item => item && item.pid && item.num > 0);

  for (const item of validCartItems) {
    let product = null;
    try {
      if (window.productCache.has(item.pid)) {
        product = window.productCache.get(item.pid);
      } else {
        const res = await axios.get(`${AppConfig.API_BASE_URL}/products/detail?pid=${item.pid}`);
        if (!res.data || typeof res.data !== 'object') throw new Error('Invalid response format');
        product = res.data.data || {};
        window.productCache.set(item.pid, product);
      }

      const productName = product.name || `Product #${item.pid}`;
      const productPrice = parseFloat(product.price || 0) || 0;
      const formattedPrice = AppUtils.formatPrice(productPrice);

      let itemEl;
      if (itemTemplate) {
        itemEl = itemTemplate.cloneNode(true);
        itemEl.classList.remove('hidden', 'cart-item-template');
      } else {
        itemEl = document.createElement('div');
        itemEl.innerHTML = `
          <div class="cart-item-name font-medium"></div>
          <div class="cart-item-price text-blue-600 font-bold"></div>
          <div class="flex items-center gap-2">
            <button class="cart-qty-minus w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center" aria-label="Decrease quantity">
              <i class="fa-solid fa-minus text-sm"></i>
            </button>
            <input type="number" class="cart-qty-input w-12 h-8 border border-gray-300 rounded-md text-center text-sm" min="1">
            <button class="cart-qty-plus w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center" aria-label="Increase quantity">
              <i class="fa-solid fa-plus text-sm"></i>
            </button>
          </div>
          <button class="cart-item-delete text-red-500 hover:text-red-700 transition-colors" aria-label="Delete product">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        `;
      }

      itemEl.dataset.pid = item.pid;
      itemEl.className = 'py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b';

      const nameEl = itemEl.querySelector('.cart-item-name');
      const priceEl = itemEl.querySelector('.cart-item-price');
      const qtyMinus = itemEl.querySelector('.cart-qty-minus');
      const qtyInput = itemEl.querySelector('.cart-qty-input');
      const qtyPlus = itemEl.querySelector('.cart-qty-plus');
      const deleteBtn = itemEl.querySelector('.cart-item-delete');

      if (nameEl) nameEl.textContent = productName;
      if (priceEl) priceEl.textContent = formattedPrice;
      if (qtyMinus) qtyMinus.dataset.pid = item.pid;
      if (qtyInput) {
        qtyInput.dataset.pid = item.pid;
        qtyInput.value = item.num || 1;
        qtyInput.min = 1;
      }
      if (qtyPlus) qtyPlus.dataset.pid = item.pid;
      if (deleteBtn) deleteBtn.dataset.pid = item.pid;

      popupItems.appendChild(itemEl);
    } catch (error) {
      console.error(`Failed to render product ${item.pid}:`, error);
      const fallbackEl = document.createElement('div');
      fallbackEl.className = 'py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b';
      fallbackEl.innerHTML = `
        <div class="font-medium">Product #${item.pid}</div>
        <div class="text-blue-600 font-bold">$0.00</div>
        <div class="flex items-center gap-2">
          <button class="cart-qty-minus w-8 h-8 rounded-md border border-gray-300" data-pid="${item.pid}"><i class="fa-solid fa-minus"></i></button>
          <input type="number" class="cart-qty-input w-12 h-8 border border-gray-300 text-center" value="${item.num || 1}" min="1" data-pid="${item.pid}">
          <button class="cart-qty-plus w-8 h-8 rounded-md border border-gray-300" data-pid="${item.pid}"><i class="fa-solid fa-plus"></i></button>
        </div>
        <button class="cart-item-delete text-red-500" data-pid="${item.pid}"><i class="fa-solid fa-trash-can"></i></button>
      `;
      popupItems.appendChild(fallbackEl);
    }
  }

  const totalPrice = validCartItems.reduce((sum, item) => {
    const product = window.productCache.get(item.pid) || {};
    const price = parseFloat(product.price || 0) || 0;
    return sum + (price * (item.num || 0));
  }, 0);
  popupTotal.textContent = AppUtils.formatPrice(totalPrice);
}

// ========== 3. Standalone Cart Page UI Rendering (Remove direct items access) ==========
async function renderCartUI(cart) {
  const cartItemsEl = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');
  const cartTitleEl = document.getElementById('cart-title');
  const cartCountEl = document.getElementById('cart-count');

  if (!cartItemsEl || !cartTotalEl || !cartTitleEl) return;

  // Fix 5: Use getCartItems()
  const cartItems = Array.isArray(cart.getCartItems()) ? cart.getCartItems() : [];
  const validCartItems = cartItems.filter(item => item && item.pid && item.num > 0);
  const totalItemCount = validCartItems.reduce((sum, item) => sum + (item.num || 0), 0);

  cartTitleEl.textContent = `My Shopping Cart (${totalItemCount} items)`;
  if (cartCountEl) cartCountEl.textContent = totalItemCount;

  if (totalItemCount === 0) {
    cartItemsEl.innerHTML = `
      <div class="text-center text-gray-500 py-12">
        <i class="fa-solid fa-cart-shopping text-5xl mb-4"></i>
        <h3 class="text-xl font-bold mb-2">Your cart is empty</h3>
        <p class="mb-4">Browse our products and add items to your cart</p>
        <a href="/index.html" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Continue Shopping
        </a>
      </div>
    `;
    cartTotalEl.textContent = AppUtils.formatPrice(0);
    return;
  }

  let cartHtml = '';
  for (const item of validCartItems) {
    let product = null;
    try {
      if (window.productCache.has(item.pid)) {
        product = window.productCache.get(item.pid);
      } else {
        const res = await axios.get(`${AppConfig.API_BASE_URL}/products/detail?pid=${item.pid}`);
        if (!res.data || typeof res.data !== 'object') throw new Error('Invalid response');
        product = res.data.data || {};
        window.productCache.set(item.pid, product);
      }

      const productName = product.name || `Product #${item.pid}`;
      const productPrice = parseFloat(product.price || 0) || 0;
      const productImg = product.img_path || AppConfig.DEFAULT_IMG || 'https://via.placeholder.com/80';
      const subtotal = productPrice * (item.num || 1);

      cartHtml += `
        <div class="flex flex-col md:flex-row items-start md:items-center gap-4 py-4 border-b" data-pid="${item.pid}">
          <img src="${productImg}" alt="${productName}" class="w-20 h-20 object-cover rounded">
          <div class="flex-1 min-w-0">
            <h4 class="font-medium line-clamp-1">${productName}</h4>
            <p class="text-gray-500 text-sm">PID: ${item.pid}</p>
          </div>
          <div class="font-bold">${AppUtils.formatPrice(productPrice)}</div>
          <div class="flex items-center border rounded">
            <button class="cart-minus px-3 py-1 border-r" data-pid="${item.pid}">
              <i class="fa-solid fa-minus text-sm"></i>
            </button>
            <input type="number" class="cart-num w-12 px-2 py-1 text-center border-0 focus:outline-none" 
                   value="${item.num || 1}" min="1" data-pid="${item.pid}">
            <button class="cart-plus px-3 py-1 border-l" data-pid="${item.pid}">
              <i class="fa-solid fa-plus text-sm"></i>
            </button>
          </div>
          <div class="font-bold text-blue-600">${AppUtils.formatPrice(subtotal)}</div>
          <button class="cart-delete text-red-500 hover:text-red-700" data-pid="${item.pid}" onclick="event.stopPropagation()">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
    } catch (error) {
      console.error(`Failed to render standalone page product ${item.pid}:`, error);
      cartHtml += `
        <div class="flex flex-col md:flex-row items-start md:items-center gap-4 py-4 border-b" data-pid="${item.pid}">
          <div class="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
            <i class="fa-solid fa-box text-gray-400"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium line-clamp-1">Product #${item.pid}</h4>
            <p class="text-gray-500 text-sm">PID: ${item.pid}</p>
          </div>
          <div class="font-bold">$0.00</div>
          <div class="flex items-center border rounded">
            <button class="cart-minus px-3 py-1 border-r" data-pid="${item.pid}">
              <i class="fa-solid fa-minus text-sm"></i>
            </button>
            <input type="number" class="cart-num w-12 px-2 py-1 text-center border-0 focus:outline-none" 
                   value="${item.num || 1}" min="1" data-pid="${item.pid}">
            <button class="cart-plus px-3 py-1 border-l" data-pid="${item.pid}">
              <i class="fa-solid fa-plus text-sm"></i>
            </button>
          </div>
          <div class="font-bold text-blue-600">$0.00</div>
          <button class="cart-delete text-red-500 hover:text-red-700" data-pid="${item.pid}" onclick="event.stopPropagation()">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
    }
  }

  cartItemsEl.innerHTML = cartHtml;
  const totalPrice = validCartItems.reduce((sum, item) => {
    const product = window.productCache.get(item.pid) || {};
    const price = parseFloat(product.price || 0) || 0;
    return sum + (price * (item.num || 0));
  }, 0);
  cartTotalEl.textContent = AppUtils.formatPrice(totalPrice);
}

// ========== 4. Interactive Event Initialization (Core Fix: Async/Await + Error Handling) ==========
function initCartEvents() {
  initCartPopupControl();

  // Quantity + button
  document.addEventListener('click', async (e) => {
    const plusBtn = e.target.closest('.cart-plus, .cart-qty-plus');
    if (!plusBtn) return;

    const pid = parseInt(plusBtn.dataset.pid);
    if (isNaN(pid)) return;

    const currentItem = window.cart.getCartItem(pid);
    if (!currentItem) return;

    try {
      // Fix 6: Async updateNum
      await window.cart.updateNum(pid, currentItem.num + 1);
      await renderCartPopup(window.cart);
      if (document.getElementById('cart-items')) await renderCartUI(window.cart);
    } catch (error) {
      console.error('Failed to increase quantity:', error);
      alert('Failed to update quantity: ' + error.message);
    }
  });

  // Quantity - button
  document.addEventListener('click', async (e) => {
    const minusBtn = e.target.closest('.cart-minus, .cart-qty-minus');
    if (!minusBtn) return;

    const pid = parseInt(minusBtn.dataset.pid);
    if (isNaN(pid)) return;

    const currentItem = window.cart.getCartItem(pid);
    if (!currentItem || currentItem.num <= 1) return;

    try {
      await window.cart.updateNum(pid, currentItem.num - 1);
      await renderCartPopup(window.cart);
      if (document.getElementById('cart-items')) await renderCartUI(window.cart);
    } catch (error) {
      console.error('Failed to decrease quantity:', error);
      alert('Failed to update quantity: ' + error.message);
    }
  });

  // Quantity input box
  document.addEventListener('input', async (e) => {
    if (!e.target.classList.contains('cart-num') && !e.target.classList.contains('cart-qty-input')) return;

    const pid = parseInt(e.target.dataset.pid);
    const newNum = Math.max(1, parseInt(e.target.value) || 1);
    if (isNaN(pid)) return;

    const currentItem = window.cart.getCartItem(pid);
    if (!currentItem) return;

    try {
      await window.cart.updateNum(pid, newNum);
      await renderCartPopup(window.cart);
      if (document.getElementById('cart-items')) await renderCartUI(window.cart);
    } catch (error) {
      console.error('Failed to update quantity via input:', error);
      alert('Failed to update quantity: ' + error.message);
    }
  });

  // Delete product
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
      // Fix 7: Async removeFromCart
      const deleteSuccess = await window.cart.removeFromCart(pid);
      if (!deleteSuccess) {
        alert('Product not in cart');
        return;
      }

      window.productCache.delete(pid);
      await renderCartPopup(window.cart);
      if (document.getElementById('cart-items')) await renderCartUI(window.cart);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product: ' + error.message);
    }
  });

  // Clear cart
  const clearCartBtn = document.getElementById('clear-cart');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Are you sure you want to clear your cart?')) return;

      try {
        // Fix 8: Async clearCart
        await window.cart.clearCart();
        window.productCache.clear();
        await renderCartPopup(window.cart);
        if (document.getElementById('cart-items')) await renderCartUI(window.cart);

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

// ========== Add to Cart (Core Fix: Async + Server Sync) ==========
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
      const res = await axios.get(`${AppConfig.API_BASE_URL}/products/detail?pid=${validPid}`);
      if (!res.data || !res.data.data) {
        alert('Product not found');
        return;
      }
      product = res.data.data;
      window.productCache.set(validPid, product);
    }

    // Fix 9: Async addToCart (server sync inside core.js)
    await window.cart.addToCart(validPid, 1);

    await renderCartPopup(window.cart);
    if (document.getElementById('cart-items')) await renderCartUI(window.cart);

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