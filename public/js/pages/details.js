/**
 * Product detail page exclusive logic
 */

// ===================== Step 1: Define missing Loading function =====================
window.showLoading = function() {
  let loadingEl = document.getElementById('global-loading');
  if (!loadingEl) {
    loadingEl = document.createElement('div');
    loadingEl.id = 'global-loading';
    loadingEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center;
      z-index: 9999; font-size: 18px; color: #165DFF;
    `;
    loadingEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading...';
    document.body.appendChild(loadingEl);
  }
  loadingEl.style.display = 'flex';
};

window.hideLoading = function() {
  const loadingEl = document.getElementById('global-loading');
  if (loadingEl) loadingEl.style.display = 'none';
};

// ===================== Step 2: Global config/utils fallback =====================
window.AppConfig = window.AppConfig || {
  API_BASE_URL: 'http://localhost:3000/api',
  DEFAULT_IMG: 'https://via.placeholder.com/200x200?text=No+Image',
  PAGE_PATHS: {
    CATEGORY_DETAIL: '../../pages/category/detail.html',
    PRODUCT_DETAIL: '../../pages/product/detail.html'
  }
};

window.AppUtils = window.AppUtils || {
  getUrlParam: function(key) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(key);
  },
  toNumber: function(value, defaultValue = 1) {
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : num;
  },
  formatPrice: function(price) {
    const num = parseFloat(price) || 0;
    return `$${num.toFixed(2)}`;
  },
  buildSliderImgs: function(mainImgPath) {
    if (!mainImgPath || mainImgPath === AppConfig.DEFAULT_IMG) {
      return [AppConfig.DEFAULT_IMG];
    }
    const imgExtIndex = mainImgPath.lastIndexOf('.');
    if (imgExtIndex === -1) return [mainImgPath];
    const imgBase = mainImgPath.substring(0, imgExtIndex);
    const imgExt = mainImgPath.substring(imgExtIndex + 1) || 'jpg';
    return [mainImgPath, `${imgBase}2.${imgExt}`, `${imgBase}3.${imgExt}`];
  }
};

window.AppCommon = window.AppCommon || {
  initMobileDrawer: function() {
    const mobileCateBtn = document.getElementById('mobile-category-btn');
    const mobileCateDrawer = document.getElementById('mobile-category-drawer');
    const mobileCateClose = document.getElementById('mobile-category-close');
    
    if (!mobileCateBtn || !mobileCateDrawer || !mobileCateClose) return;
    
    mobileCateBtn.addEventListener('click', () => {
      mobileCateDrawer.classList.remove('-translate-x-full');
    });
    mobileCateClose.addEventListener('click', () => {
      mobileCateDrawer.classList.add('-translate-x-full');
    });
    document.addEventListener('click', (e) => {
      if (!mobileCateDrawer.contains(e.target) && !mobileCateBtn.contains(e.target)) {
        mobileCateDrawer.classList.add('-translate-x-full');
      }
    });
  },
  initSwiper: function(selector = '.mySwiper', customConfig = {}) {
    if (!window.Swiper) {
      console.warn('Swiper library not imported');
      return null;
    }
    const config = {
      loop: true,
      autoplay: { delay: 3000, disableOnInteraction: false },
      speed: 500,
      ...customConfig
    };
    return new Swiper(selector, config);
  },
  loadAllCategories: async function(activeCatId) {
    try {
      const res = await axios.get(`${AppConfig.API_BASE_URL}/cate/all`);
      const categories = res.data.data || [];
      const sidebarList = document.getElementById('sidebar-cate-list');
      const mobileList = document.getElementById('mobile-cate-list');
      if (!sidebarList || !mobileList) return;
      if (categories.length === 0) {
        sidebarList.innerHTML = '<li class="text-gray-500 px-3 py-2">No categories</li>';
        mobileList.innerHTML = '<li class="text-gray-500 px-3 py-2">No categories</li>';
        return;
      }
      let html = '';
      categories.forEach(cate => {
        const cateId = AppUtils.toNumber(cate.catid || 0, 0);
        if (cateId === 0) return;
        const isActive = cateId === activeCatId;
        html += `
          <a href="${AppConfig.PAGE_PATHS.CATEGORY_DETAIL}?catid=${cateId}" 
             class="block px-3 py-2 rounded-md transition-colors ${isActive ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-600 hover:bg-blue-100 hover:text-blue-600'}">
              ${cate.name || 'Unnamed Category'}
          </a>
        `;
      });
      sidebarList.innerHTML = html;
      mobileList.innerHTML = html;
    } catch (e) {
      console.error('Failed to load category list:', e);
      const errorHtml = '<li class="text-red-500 px-3 py-2">Load failed</li>';
      if (sidebarList) sidebarList.innerHTML = errorHtml;
      if (mobileList) mobileList.innerHTML = errorHtml;
    }
  },
  renderShoppingCart: function(cart) {
    if (!cart || !cart.getCartItems) {
      console.warn('Invalid cart instance');
      return;
    }
    const cartCountEl = document.getElementById('cart-count');
    const cartTitleEl = document.getElementById('cart-popup-title');
    const cartItemsEl = document.getElementById('cart-popup-items');
    const cartTotalEl = document.getElementById('cart-popup-total');

    const cartItems = cart.getCartItems() || [];
    const totalItems = cart.getTotalItemCount() || 0;
    const totalPrice = cart.getTotalPrice ? cart.getTotalPrice() : 0;

    if (cartCountEl) cartCountEl.textContent = totalItems;
    if (cartTitleEl) cartTitleEl.textContent = `My Shopping List (${totalItems} items)`;

    if (cartItemsEl) {
      if (cartItems.length === 0) {
        cartItemsEl.innerHTML = '<div class="text-center text-gray-500 py-4">Your cart is empty</div>';
      } else {
        let cartHtml = '';
        cartItems.forEach(item => {
          const pid = AppUtils.toNumber(item.pid || 0, 0);
          if (pid === 0) return;
          const productName = item.name || `Product #${pid}`;
          const productPrice = AppUtils.formatPrice(item.price || 0);
          const quantity = AppUtils.toNumber(item.num || 1, 1);
          cartHtml += `
            <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2" data-pid="${pid}">
              <div class="flex-1">
                <h4 class="font-medium text-gray-800">${productName}</h4>
                <p class="text-blue-600 font-bold">${productPrice}</p>
              </div>
              <div class="flex items-center gap-2">
                <button class="cart-qty-minus w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors" onclick="cart.updateNum(${pid}, ${quantity - 1}); AppCommon.renderShoppingCart(cart);">
                  <i class="fa-solid fa-minus text-sm"></i>
                </button>
                <input type="number" class="cart-qty-input w-12 h-8 border border-gray-300 rounded-md text-center text-sm" value="${quantity}" min="1" onchange="cart.updateNum(${pid}, this.value); AppCommon.renderShoppingCart(cart);">
                <button class="cart-qty-plus w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors" onclick="cart.updateNum(${pid}, ${quantity + 1}); AppCommon.renderShoppingCart(cart);">
                  <i class="fa-solid fa-plus text-sm"></i>
                </button>
              </div>
              <button class="cart-item-delete text-red-500 hover:text-red-700 transition-colors" onclick="cart.removeFromCart(${pid}); AppCommon.renderShoppingCart(cart);">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          `;
        });
        cartItemsEl.innerHTML = cartHtml;
      }
    }
    if (cartTotalEl) cartTotalEl.textContent = AppUtils.formatPrice(totalPrice);
  }
};

// ===================== Step 3: Core product detail rendering function =====================
function renderBreadcrumb(product) {
  const cateLink = document.getElementById('breadcrumb-cate-link');
  const proName = document.getElementById('breadcrumb-pro-name');
  if (cateLink) {
    const cateId = AppUtils.toNumber(product.catid || 0, 0);
    cateLink.href = cateId > 0 ? `${AppConfig.PAGE_PATHS.CATEGORY_DETAIL}?catid=${cateId}` : '#';
    cateLink.textContent = product.cateName || product.cate_name || 'Uncategorized';
  }
  if (proName) proName.textContent = product.name || 'Unknown Product';
}

function renderProductInfo(product) {
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  if (addToCartBtn) addToCartBtn.dataset.pid = product.pid || product.id || 0;

  if (document.getElementById('product-name'))
    document.getElementById('product-name').textContent = product.name || 'No Name';
  if (document.getElementById('product-short-desc'))
    document.getElementById('product-short-desc').textContent = product.short_desc || product.description || 'No description';
  if (document.getElementById('product-price'))
    document.getElementById('product-price').textContent = AppUtils.formatPrice(product.price);
  if (document.getElementById('product-desc'))
    document.getElementById('product-desc').textContent = product.description || 'No detailed description';
}

// ===================== 【唯一改动：这里自动拼 origin.jpg，兼容旧逻辑】 =====================
function renderProductSlider(product) {
  const sliderWrapper = document.getElementById('product-slider');
  if (!sliderWrapper) return;
  sliderWrapper.innerHTML = '';

  let imgUrl = AppConfig.DEFAULT_IMG;

  if (product.img_path) {
    // 自动判断：有目录结构就用 origin.jpg，否则保持原来的路径
    if (product.img_path.includes('/images/') && !product.img_path.includes('.')) {
      imgUrl = `${product.img_path}/origin.jpg`;
    } else {
      imgUrl = product.img_path;
    }
  }

  sliderWrapper.innerHTML = `
    <div class="swiper-slide flex items-center justify-center bg-gray-100">
      <img src="${imgUrl}" class="max-h-full object-contain" alt="${product.name || 'Product image'}"
           onerror="this.src='${AppConfig.DEFAULT_IMG}'">
    </div>
  `;
}
// ===================== 【改动结束，其他完全不动】 =====================

function renderErrorPage() {
  hideLoading();
  if (document.getElementById('product-name'))
    document.getElementById('product-name').textContent = 'Product Load Failed';
  if (document.getElementById('product-price'))
    document.getElementById('product-price').textContent = AppUtils.formatPrice(0);
  if (document.getElementById('product-desc'))
    document.getElementById('product-desc').textContent = 'Failed to load product data. Please try again later.';
  if (document.getElementById('breadcrumb-pro-name'))
    document.getElementById('breadcrumb-pro-name').textContent = 'Load Failed';
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  if (addToCartBtn) addToCartBtn.dataset.pid = 0;
}

async function loadProductDetail(pid) {
  try {
    console.log('PID passed to backend API:', pid);
    const res = await axios.get(`${AppConfig.API_BASE_URL}/products/detail?pid=${pid}`);
    const result = res.data;

    if (result.code !== 0 || !result.data) {
      throw new Error(result.msg || 'Product does not exist');
    }

    const product = result.data;
    document.title = `${product.name || 'Product Detail'} - ShopEasy`;
    renderBreadcrumb(product);
    renderProductInfo(product);

    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
      addToCartBtn.onclick = null;
      addToCartBtn.dataset.pid = product.pid;
      addToCartBtn.addEventListener('click', window.handleAddToCart);
      console.log('Product page add-to-cart button bound with PID:', product.pid);
    }

    renderProductSlider(product);
    await AppCommon.loadAllCategories(AppUtils.toNumber(product.catid || 0, 0));
  } catch (error) {
    throw new Error(`Failed to load product: ${error.message}`);
  }
}

// ===================== Step 4: Page initialization entry =====================
document.addEventListener('DOMContentLoaded', async () => {
  const rawPid = AppUtils.getUrlParam('pid');
  console.log('Original PID passed via jump:', rawPid);
  let pid = AppUtils.toNumber(rawPid, 9);
  console.log('Processed valid PID:', pid);

  try {
    showLoading();
    AppCommon.initMobileDrawer();
    
    if (pid <= 0) throw new Error('Invalid product ID');
    
    await loadProductDetail(pid);
    
    setTimeout(() => {
      AppCommon.initSwiper('.mySwiper', {
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { 
          nextEl: '.swiper-button-next', 
          prevEl: '.swiper-button-prev'
        },
        slidesPerView: 1,
        height: '100%'
      });
    }, 200);

    const quantityEl = document.getElementById('product-quantity');
    if (quantityEl) {
      quantityEl.addEventListener('change', () => {
        const num = AppUtils.toNumber(quantityEl.value, 1);
        quantityEl.value = num < 1 ? 1 : num;
      });
    }

    if (window.initCartGlobal) {
      await window.initCartGlobal();
    }

    hideLoading();
  } catch (error) {
    console.error('Product detail loading failed:', error);
    hideLoading();
    renderErrorPage();
  }
});

// ===================== Add to cart function =====================
window.handleAddToCart = function(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const pid = AppUtils.toNumber(addToCartBtn?.dataset.pid || 0, 0);
  if (pid <= 0) {
    alert('Invalid product ID, cannot add to cart!');
    return;
  }

  if (window.cart && typeof window.cart.addToCart === 'function') {
    (window.initCartGlobal ? window.initCartGlobal() : Promise.resolve()).then(() => {
      window.cart.addToCart(pid, 1);
      window.cart.saveToLocalStorage();
      if (typeof AppCommon.renderShoppingCart === 'function') {
        AppCommon.renderShoppingCart(window.cart);
      }
      const cartPopup = document.getElementById('cart-popup');
      if (cartPopup) {
        cartPopup.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        cartPopup.classList.add('opacity-100', 'pointer-events-auto');
      }
      alert(`Successfully added product #${pid} to cart!`);
    });
  } else if (window.addToCartOriginal) {
    window.addToCartOriginal(pid, e);
    alert(`Successfully added product ${pid} to cart!`);
    if (window.cart && typeof AppCommon.renderShoppingCart === 'function') {
      AppCommon.renderShoppingCart(window.cart);
      const cartToggle = document.getElementById('cart-toggle');
      if (cartToggle) cartToggle.checked = true;
    }
  } else if (window.addToCart) {
    window.addToCart(pid, e);
  } else {
    alert('Cart function not loaded, please refresh page and try again!');
  }
};

window.addToCart = function(pid, e) {
  if (e) e.preventDefault();
  if (window.cart && typeof window.cart.addToCart === 'function') {
    window.cart.addToCart(pid, 1);
    window.cart.saveToLocalStorage();
    if (window.cart && typeof AppCommon.renderShoppingCart === 'function') {
      AppCommon.renderShoppingCart(window.cart);
    }
    alert(`Product #${pid} added to cart!`);
  } else {
    alert(`Product ${pid} added to cart!`);
    if (window.initCartGlobal) {
      window.initCartGlobal().then(() => {
        if (window.cart && typeof AppCommon.renderShoppingCart === 'function') {
          AppCommon.renderShoppingCart(window.cart);
        }
      });
    }
  }
};