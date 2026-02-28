
// ========== 全局常量 & 工具函数（修复：全局挂载+兜底） ==========
// 1. 全局商品缓存（所有页面共用，修复局部缓存问题）
window.productCache = window.productCache || new Map();

// 2. 全局依赖兜底（解决产品页AppUtils/AppConfig加载晚的问题）
window.AppUtils = window.AppUtils || {
  formatPrice: function(price) {
    const num = parseFloat(price) || 0;
    return `$${num.toFixed(2)}`;
  }
};

window.AppConfig = window.AppConfig || {
  API_BASE_URL: 'http://localhost:3000/api',
  DEFAULT_IMG: 'https://via.placeholder.com/200x200?text=No+Image'
};

// 3. 全局状态标记（防止重复初始化/事件绑定）
window.cartInitialized = false;      // 购物车是否已初始化
window.cartEventsInitialized = false;// 购物车事件是否已绑定

// ========== 全局购物车实例初始化（核心修复：全局挂载+校验） ==========
// 全局cart实例（修复局部变量问题，所有页面可访问）
window.cart = window.cart || null;

async function initCartGlobal() {
  try {
    // 修复5：先校验ShoppingCart类是否存在（核心）
    if (typeof ShoppingCart !== 'function') {
      throw new Error('ShoppingCart class not found! Please load cart/core.js first.');
    }

    // 初始化全局cart实例（只创建一次）
    if (!window.cart) {
      window.cart = new ShoppingCart();
      // 修复1：强制初始化cart.items为数组，兼容localStorage数据异常
      window.cart.loadFromLocalStorage();
      window.cart.items = Array.isArray(window.cart.items) ? window.cart.items : [];
    }

    // 修复4：事件只绑定一次（避免重复触发）
    if (!window.cartEventsInitialized) {
      initCartEvents();
      window.cartEventsInitialized = true;
    }

    // 渲染购物车（优先弹窗，再独立页）
    await renderCartPopup(window.cart);
    if (document.getElementById('cart-items')) {
      await renderCartUI(window.cart);
    }

    // 标记初始化完成
    window.cartInitialized = true;
    console.log('购物车初始化成功，当前商品数:', window.cart.getTotalItemCount());
  } catch (error) {
    console.error('购物车初始化失败:', error);
    // 兜底：强制重置全局cart实例
    if (typeof ShoppingCart === 'function') {
      window.cart = new ShoppingCart();
      window.cart.items = [];
      window.cart.saveToLocalStorage();
      await renderCartPopup(window.cart);
      window.cartInitialized = true;
    } else {
      alert('Cart initialization failed: Missing core cart class!');
    }
  }
}

// 页面加载时初始化（修复6：避免重复初始化）
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.cartInitialized) {
    await initCartGlobal();
  }
});

// 页面回退/刷新时只重新渲染（不重置数据）
window.addEventListener('pageshow', async () => {
  if (window.cart && window.cartInitialized) {
    // 仅重新渲染，不重复初始化
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

  // ========== 核心状态管理（仅控制显隐，不碰样式） ==========
  let isPopupOpen = false; // 初始关闭
  let hoverCloseTimer = null;
  const HOVER_DELAY = 300;

  // ========== 显隐函数（仅操作原有样式类，不新增行内样式） ==========
  // 打开弹窗：只操作你原有样式类，和之前逻辑完全一致
  const openPopup = () => {
    clearTimeout(hoverCloseTimer);
    // 仅恢复你原有样式，不新增任何样式
    cartPopup.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
    cartPopup.classList.add('opacity-100', 'pointer-events-auto');
    isPopupOpen = true;
    renderCartPopup(window.cart).catch(err => console.error('渲染弹窗失败:', err));
  };

  // 关闭弹窗：仅操作原有样式类
  const closePopup = () => {
    clearTimeout(hoverCloseTimer);
    cartPopup.classList.add('hidden', 'opacity-0', 'pointer-events-none');
    cartPopup.classList.remove('opacity-100', 'pointer-events-auto');
    isPopupOpen = false;
  };

  // ========== 1. 未显示时：悬停打开（打开后失效） ==========
  cartEntry.addEventListener('mouseenter', () => {
    if (!isPopupOpen) openPopup();
  });

  cartEntry.addEventListener('mouseleave', () => {
    if (!isPopupOpen) {
      hoverCloseTimer = setTimeout(closePopup, HOVER_DELAY);
    }
  });

  // ========== 2. 点击切换（未开→开，已开→关） ==========
  cartEntry.addEventListener('click', (e) => {
    const isControlBtn = e.target.closest('.cart-qty-minus, .cart-qty-plus, .cart-qty-input, .cart-item-delete');
    if (!isControlBtn) {
      isPopupOpen ? closePopup() : openPopup();
    }
  });

  // ========== 3. 关闭按钮（手动加，不自动创建→避免撑大容器） ==========
  // 仅绑定已有关闭按钮（你手动加在HTML里，不自动创建）
  const closeBtn = cartPopup.querySelector('.cart-popup-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closePopup();
    });
  }

  // ========== 4. 兼容：点击外部/ESC关闭（保留原有逻辑） ==========
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

  // ========== 5. 弹窗内停留：屏蔽悬停干扰（仅清定时器，不改样式） ==========
  cartPopup.addEventListener('mouseenter', () => {
    clearTimeout(hoverCloseTimer);
  });
  cartPopup.addEventListener('mouseleave', () => {
    if (!isPopupOpen) {
      hoverCloseTimer = setTimeout(closePopup, HOVER_DELAY);
    }
  });
}

// ========== 2. 弹窗UI渲染（核心修复：全局cart+容错） ==========
async function renderCartPopup(cart) {
  const popupItems = document.getElementById('cart-popup-items');
  const popupTotal = document.getElementById('cart-popup-total');
  const cartCount = document.getElementById('cart-count');
  const cartTitle = document.getElementById('cart-popup-title');

  // 容错：缺少核心DOM直接返回
  if (!popupItems || !popupTotal || !cartCount) {
    console.warn('购物车弹窗核心DOM缺失');
    return;
  }

  // 修复5：强制确保cart数据有效
  const cartItems = Array.isArray(cart.getCartItems()) ? cart.getCartItems() : [];
  const totalItemCount = cartItems.reduce((sum, item) => sum + (item.num || 0), 0);

  // 更新顶部计数和标题
  cartCount.textContent = totalItemCount;
  if (cartTitle) cartTitle.textContent = `Your Cart (${totalItemCount} items)`;

  // 空购物车处理
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

  // 非空购物车：渲染商品列表
  popupItems.innerHTML = '';
  const itemTemplate = document.querySelector('.cart-item-template');

  // 修复6：遍历前先过滤无效商品
  const validCartItems = cartItems.filter(item => item && item.pid && item.num > 0);

  for (const item of validCartItems) {
    let product = null;
    try {
      // 优先使用全局缓存，避免重复请求
      if (window.productCache.has(item.pid)) {
        product = window.productCache.get(item.pid);
      } else {
        const res = await axios.get(`${AppConfig.API_BASE_URL}/products/detail?pid=${item.pid}`);
        // 修复7：严格校验接口返回格式
        if (!res.data || typeof res.data !== 'object') throw new Error('Invalid response format');
        product = res.data.data || {};
        window.productCache.set(item.pid, product); // 全局缓存
      }

      const productName = product.name || `Product #${item.pid}`;
      const productPrice = parseFloat(product.price || 0) || 0;
      const formattedPrice = AppUtils.formatPrice(productPrice);

      // 修复8：确保商品项DOM结构完整（无论是否有模板）
      let itemEl;
      if (itemTemplate) {
        itemEl = itemTemplate.cloneNode(true);
        itemEl.classList.remove('hidden', 'cart-item-template');
      } else {
        // 无模板时，手动创建完整结构
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

      // 统一设置样式和数据
      itemEl.dataset.pid = item.pid;
      itemEl.className = 'py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b';

      // 填充商品信息（容错：确保子元素存在）
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
      console.error(`渲染商品${item.pid}失败:`, error);
      // 兜底：创建基础商品项，确保不中断渲染
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

  // 计算总价（使用全局缓存）
  const totalPrice = validCartItems.reduce((sum, item) => {
    const product = window.productCache.get(item.pid) || {};
    const price = parseFloat(product.price || 0) || 0;
    return sum + (price * (item.num || 0));
  }, 0);
  popupTotal.textContent = AppUtils.formatPrice(totalPrice);
}

// ========== 3. 独立购物车页UI渲染（复用弹窗修复逻辑） ==========
async function renderCartUI(cart) {
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
      console.error(`渲染独立页商品${item.pid}失败:`, error);
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

// ========== 4. 交互事件初始化（修复：只绑定一次+容错） ==========
function initCartEvents() {
  // 先初始化弹窗控制
  initCartPopupControl();

  // 数量+按钮
  document.addEventListener('click', async (e) => {
    const plusBtn = e.target.closest('.cart-plus, .cart-qty-plus');
    if (!plusBtn) return;

    const pid = parseInt(plusBtn.dataset.pid);
    if (isNaN(pid)) return;

    // 修复9：验证商品存在后再更新
    const currentItem = window.cart.getCartItem(pid);
    if (!currentItem) return;

    window.cart.updateNum(pid, currentItem.num + 1);
    window.cart.saveToLocalStorage();
    await renderCartPopup(window.cart);
    if (document.getElementById('cart-items')) await renderCartUI(window.cart);
  });

  // 数量-按钮
  document.addEventListener('click', async (e) => {
    const minusBtn = e.target.closest('.cart-minus, .cart-qty-minus');
    if (!minusBtn) return;

    const pid = parseInt(minusBtn.dataset.pid);
    if (isNaN(pid)) return;

    const currentItem = window.cart.getCartItem(pid);
    if (!currentItem || currentItem.num <= 1) return;

    window.cart.updateNum(pid, currentItem.num - 1);
    window.cart.saveToLocalStorage();
    await renderCartPopup(window.cart);
    if (document.getElementById('cart-items')) await renderCartUI(window.cart);
  });

  // 数量输入框
  document.addEventListener('input', async (e) => {
    if (!e.target.classList.contains('cart-num') && !e.target.classList.contains('cart-qty-input')) return;

    const pid = parseInt(e.target.dataset.pid);
    const newNum = Math.max(1, parseInt(e.target.value) || 1); // 确保数量≥1
    if (isNaN(pid)) return;

    const currentItem = window.cart.getCartItem(pid);
    if (!currentItem) return;

    window.cart.updateNum(pid, newNum);
    window.cart.saveToLocalStorage();
    await renderCartPopup(window.cart);
    if (document.getElementById('cart-items')) await renderCartUI(window.cart);
  });

  // 删除商品（弹窗+独立页）
  document.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.cart-item-delete, .cart-delete');
    if (!deleteBtn) return;

    // 修复10：阻止事件冒泡，避免弹窗关闭
    e.stopPropagation();

    const pid = parseInt(deleteBtn.dataset.pid);
    if (isNaN(pid) || pid <= 0) {
      alert('Invalid product ID');
      return;
    }

    if (!confirm('Are you sure you want to remove this item?')) return;

    try {
      const deleteSuccess = window.cart.removeFromCart(pid);
      if (!deleteSuccess) {
        alert('Product not in cart');
        return;
      }

      window.productCache.delete(pid); // 清除全局缓存
      window.cart.saveToLocalStorage();
      await renderCartPopup(window.cart);
      if (document.getElementById('cart-items')) await renderCartUI(window.cart);
    } catch (error) {
      console.error('删除商品失败:', error);
      alert('Failed to delete product');
    }
  });

  // 清空购物车
  const clearCartBtn = document.getElementById('clear-cart');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Are you sure you want to clear your cart?')) return;

      try {
        window.cart.clearCart();
        window.productCache.clear(); // 清空全局缓存
        window.cart.saveToLocalStorage();
        await renderCartPopup(window.cart);
        if (document.getElementById('cart-items')) await renderCartUI(window.cart);

        // 重置弹窗状态（修复8：样式兜底）
        const cartPopup = document.getElementById('cart-popup');
        if (cartPopup) {
          cartPopup.classList.add('hidden', 'opacity-0', 'pointer-events-none');
        }
      } catch (error) {
        console.error('清空购物车失败:', error);
        alert('Failed to clear cart');
      }
    });
  }
}


window.addToCart = async function(pid, e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  // 1. 日志：确认传入的PID是否正确
  console.log('【加购第一步】接收的PID：', pid);
  const validPid = parseInt(pid) || 0;
  console.log('【加购第二步】转换后的有效PID：', validPid);

  // 2. 确保cart初始化
  if (!window.cart) {
    console.log('【加购第三步】cart未初始化，开始初始化');
    await initCartGlobal();
  }
  console.log('【加购第四步】cart实例：', window.cart);
  console.log('【加购第四步】cart当前商品列表：', window.cart.items);

  // 3. 校验PID
  if (validPid <= 0) {
    alert('Invalid product ID');
    return;
  }

  try {
    // 4. 尝试获取商品信息（日志验证）
    let product = null;
    if (window.productCache.has(validPid)) {
      product = window.productCache.get(validPid);
      console.log('【加购第五步】从缓存获取商品：', product);
    } else {
      console.log('【加购第五步】缓存无商品，请求接口');
      const res = await axios.get(`${AppConfig.API_BASE_URL}/products/detail?pid=${validPid}`);
      if (!res.data || !res.data.data) {
        alert('Product not found');
        console.log('【加购失败】接口返回无效数据：', res.data);
        return;
      }
      product = res.data.data;
      window.productCache.set(validPid, product);
    }

    // 5. 核心：真正向cart添加商品（加日志验证）
    const existingItem = window.cart.getCartItem(validPid);
    console.log('【加购第六步】是否已有该商品：', existingItem);
    if (existingItem) {
      window.cart.updateNum(validPid, existingItem.num + 1);
      console.log('【加购第七步】更新商品数量后，cart.items：', window.cart.items);
    } else {
      window.cart.addToCart(validPid, 1);
      console.log('【加购第七步】新增商品后，cart.items：', window.cart.items);
    }

    // 6. 强制保存到本地存储（关键：避免数据丢失）
    window.cart.saveToLocalStorage();
    console.log('【加购第八步】保存后本地存储的cart数据：', localStorage.getItem('shoppingCart'));

    // 7. 重新渲染购物车（关键：同步最新数据）
    await renderCartPopup(window.cart);
    if (document.getElementById('cart-items')) await renderCartUI(window.cart);

    // 8. 显示成功提示
    alert(`✅ ${product.name || `Product #${validPid}`} added to cart!`);
    console.log('【加购成功】最终cart商品数：', window.cart.getTotalItemCount());

    // 9. 强制显示弹窗
    const cartPopup = document.getElementById('cart-popup');
    if (cartPopup) {
      cartPopup.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      cartPopup.classList.add('opacity-100', 'pointer-events-auto');
    }
  } catch (error) {
    console.error('【加购异常】完整错误：', error);
    // 兜底加购（即使接口失败，也强制加入cart）
    if (validPid > 0) {
      const existingItem = window.cart.getCartItem(validPid);
      if (existingItem) {
        window.cart.updateNum(validPid, existingItem.num + 1);
      } else {
        window.cart.addToCart(validPid, 1);
      }
      window.cart.saveToLocalStorage();
      await renderCartPopup(window.cart);
      alert(`✅ Product #${validPid} added to cart (offline mode)!`);
      console.log('【兜底加购后】cart.items：', window.cart.items);
    } else {
      alert('❌ Failed to add product to cart');
    }
  }
};