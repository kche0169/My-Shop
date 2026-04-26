/**
 * Cart Renderer
 * 购物车 UI 渲染逻辑
 */
export class CartRenderer {
  constructor() {
    this.productCache = window.productCache || new Map();
  }

  async renderPopup(cart) {
    const popupItems = document.getElementById('cart-popup-items');
    const popupTotal = document.getElementById('cart-popup-total');
    const cartCount = document.getElementById('cart-count');
    const cartTitle = document.getElementById('cart-popup-title');

    if (!popupItems || !popupTotal || !cartCount) {
      console.warn('Cart popup core DOM missing');
      return;
    }

    const cartItems = Array.isArray(cart.getCartItems()) ? cart.getCartItems() : [];
    const totalItemCount = cartItems.reduce((sum, item) => sum + (item.num || 0), 0);

    cartCount.textContent = totalItemCount;
    if (cartTitle) cartTitle.textContent = `Your Cart (${totalItemCount} items)`;

    if (totalItemCount === 0) {
      popupItems.innerHTML = this.getEmptyCartHtml();
      popupTotal.textContent = window.AppUtils.formatPrice(0);
      return;
    }

    popupItems.innerHTML = '';
    const itemTemplate = document.querySelector('.cart-item-template');
    const validCartItems = cartItems.filter(item => item && item.pid && item.num > 0);

    for (const item of validCartItems) {
      const itemEl = await this.createPopupItem(item, itemTemplate);
      popupItems.appendChild(itemEl);
    }

    const totalPrice = validCartItems.reduce((sum, item) => {
      const product = this.productCache.get(item.pid) || {};
      const price = parseFloat(product.price || 0) || 0;
      return sum + (price * (item.num || 0));
    }, 0);
    popupTotal.textContent = window.AppUtils.formatPrice(totalPrice);
  }

  async createPopupItem(item, template) {
    let product = null;
    try {
      if (this.productCache.has(item.pid)) {
        product = this.productCache.get(item.pid);
      } else {
        const res = await axios.get(`${window.AppConfig.API_BASE_URL}/products/detail?pid=${item.pid}`);
        if (!res.data || typeof res.data !== 'object') throw new Error('Invalid response format');
        product = res.data.data || {};
        this.productCache.set(item.pid, product);
      }

      const productName = product.name || `Product #${item.pid}`;
      const productPrice = parseFloat(product.price || 0) || 0;
      const formattedPrice = window.AppUtils.formatPrice(productPrice);

      let itemEl;
      if (template) {
        itemEl = template.cloneNode(true);
        itemEl.classList.remove('hidden', 'cart-item-template');
      } else {
        itemEl = document.createElement('div');
        itemEl.innerHTML = this.getPopupItemHtml(item.pid, productName, formattedPrice, item.num);
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

      return itemEl;
    } catch (error) {
      console.error(`Failed to render product ${item.pid}:`, error);
      const fallbackEl = document.createElement('div');
      fallbackEl.className = 'py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b';
      fallbackEl.innerHTML = this.getFallbackItemHtml(item);
      return fallbackEl;
    }
  }

  async renderPage(cart) {
    const cartItemsEl = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    const cartTitleEl = document.getElementById('cart-title');
    const cartCountEl = document.getElementById('cart-count');

    if (!cartItemsEl || !cartTotalEl || !cartTitleEl) return;

    const cartItems = Array.isArray(cart.getCartItems()) ? cart.getCartItems() : [];
    const validCartItems = cartItems.filter(item => item && item.pid && item.num > 0);
    const totalItemCount = validCartItems.reduce((sum, item) => sum + (item.num || 0), 0);

    cartTitleEl.textContent = `My Shopping Cart (${totalItemCount} items)`;
    if (cartCountEl) cartCountEl.textContent = totalItemCount;

    if (totalItemCount === 0) {
      cartItemsEl.innerHTML = this.getEmptyCartPageHtml();
      cartTotalEl.textContent = window.AppUtils.formatPrice(0);
      return;
    }

    let cartHtml = '';
    for (const item of validCartItems) {
      try {
        const itemHtml = await this.createPageItem(item);
        cartHtml += itemHtml;
      } catch (error) {
        console.error(`Failed to render standalone page product ${item.pid}:`, error);
        cartHtml += this.getFallbackPageItem(item);
      }
    }

    cartItemsEl.innerHTML = cartHtml;

    const totalPrice = validCartItems.reduce((sum, item) => {
      const product = this.productCache.get(item.pid) || {};
      const price = parseFloat(product.price || 0) || 0;
      return sum + (price * (item.num || 0));
    }, 0);
    cartTotalEl.textContent = window.AppUtils.formatPrice(totalPrice);
  }

  async createPageItem(item) {
    let product = null;
    if (this.productCache.has(item.pid)) {
      product = this.productCache.get(item.pid);
    } else {
      const res = await axios.get(`${window.AppConfig.API_BASE_URL}/products/detail?pid=${item.pid}`);
      if (!res.data || typeof res.data !== 'object') throw new Error('Invalid response');
      product = res.data.data || {};
      this.productCache.set(item.pid, product);
    }

    const productName = product.name || `Product #${item.pid}`;
    const productPrice = parseFloat(product.price || 0) || 0;
    const productImg = product.img_path || window.AppConfig.DEFAULT_IMG || 'https://via.placeholder.com/80';
    const subtotal = productPrice * (item.num || 1);

    return `
      <div class="flex flex-col md:flex-row items-start md:items-center gap-4 py-4 border-b" data-pid="${item.pid}">
        <img src="${productImg}" alt="${productName}" class="w-20 h-20 object-cover rounded">
        <div class="flex-1 min-w-0">
          <h4 class="font-medium line-clamp-1">${productName}</h4>
          <p class="text-gray-500 text-sm">PID: ${item.pid}</p>
        </div>
        <div class="font-bold">${window.AppUtils.formatPrice(productPrice)}</div>
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
        <div class="font-bold text-blue-600">${window.AppUtils.formatPrice(subtotal)}</div>
        <button class="cart-delete text-red-500 hover:text-red-700" data-pid="${item.pid}" onclick="event.stopPropagation()">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
  }

  getEmptyCartHtml() {
    return `
      <div class="text-center text-gray-500 py-6">
        <i class="fa-solid fa-cart-shopping text-3xl mb-2"></i>
        <p>Your cart is empty</p>
      </div>
    `;
  }

  getEmptyCartPageHtml() {
    return `
      <div class="text-center text-gray-500 py-12">
        <i class="fa-solid fa-cart-shopping text-5xl mb-4"></i>
        <h3 class="text-xl font-bold mb-2">Your cart is empty</h3>
        <p class="mb-4">Browse our products and add items to your cart</p>
        <a href="/index.html" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Continue Shopping
        </a>
      </div>
    `;
  }

  getPopupItemHtml(pid, name, price, num) {
    return `
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

  getFallbackItemHtml(item) {
    return `
      <div class="font-medium">Product #${item.pid}</div>
      <div class="text-blue-600 font-bold">$0.00</div>
      <div class="flex items-center gap-2">
        <button class="cart-qty-minus w-8 h-8 rounded-md border border-gray-300" data-pid="${item.pid}"><i class="fa-solid fa-minus"></i></button>
        <input type="number" class="cart-qty-input w-12 h-8 border border-gray-300 text-center" value="${item.num || 1}" min="1" data-pid="${item.pid}">
        <button class="cart-qty-plus w-8 h-8 rounded-md border border-gray-300" data-pid="${item.pid}"><i class="fa-solid fa-plus"></i></button>
      </div>
      <button class="cart-item-delete text-red-500" data-pid="${item.pid}"><i class="fa-solid fa-trash-can"></i></button>
    `;
  }

  getFallbackPageItem(item) {
    return `
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

export default new CartRenderer();