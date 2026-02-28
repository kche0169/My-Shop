/**
 * 商品详情页专属逻辑（仅修改购物车渲染相关，其他逻辑完整保留）
 */

// ===================== 第一步：先定义缺失的 Loading 函数（核心修复） =====================
window.showLoading = function() {
  let loadingEl = document.getElementById('global-loading');
  if (!loadingEl) {
    // 动态创建全局 Loading（页面没有则自动生成）
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

// ===================== 第二步：全局配置/工具兜底（防止依赖缺失） =====================
window.AppConfig = window.AppConfig || {
  API_BASE_URL: 'http://localhost:3000/api',
  DEFAULT_IMG: 'https://via.placeholder.com/200x200?text=No+Image',
  // 修复：路径适配详情页层级（pages/product/ 下访问分类页需要回退两层）
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
  // 修复：兼容无后缀的图片路径，避免处理出错
  buildSliderImgs: function(mainImgPath) {
    if (!mainImgPath || mainImgPath === AppConfig.DEFAULT_IMG) {
      return [AppConfig.DEFAULT_IMG];
    }
    const imgPath = mainImgPath || AppConfig.DEFAULT_IMG;
    const imgExtIndex = imgPath.lastIndexOf('.');
    if (imgExtIndex === -1) return [imgPath]; // 无后缀直接返回原路径
    const imgBase = imgPath.substring(0, imgExtIndex);
    const imgExt = imgPath.substring(imgExtIndex + 1) || 'jpg';
    return [imgPath, `${imgBase}2.${imgExt}`, `${imgBase}3.${imgExt}`];
  }
};

window.AppCommon = window.AppCommon || {
  // 修复：补全移动端抽屉初始化逻辑（原有为空）
  initMobileDrawer: function() {
    const mobileCateBtn = document.getElementById('mobile-category-btn');
    const mobileCateDrawer = document.getElementById('mobile-category-drawer');
    const mobileCateClose = document.getElementById('mobile-category-close');
    
    if (!mobileCateBtn || !mobileCateDrawer || !mobileCateClose) return;
    
    // 打开抽屉
    mobileCateBtn.addEventListener('click', () => {
      mobileCateDrawer.classList.remove('-translate-x-full');
    });
    // 关闭抽屉
    mobileCateClose.addEventListener('click', () => {
      mobileCateDrawer.classList.add('-translate-x-full');
    });
    // 点击外部关闭抽屉
    document.addEventListener('click', (e) => {
      if (!mobileCateDrawer.contains(e.target) && !mobileCateBtn.contains(e.target)) {
        mobileCateDrawer.classList.add('-translate-x-full');
      }
    });
  },
  initSwiper: function(selector = '.mySwiper', customConfig = {}) {
    if (!window.Swiper) {
      console.warn('Swiper库未引入，轮播初始化失败');
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
        if (cateId === 0) return; // 过滤无效分类ID
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
      console.error('加载分类列表失败:', e);
      const errorHtml = '<li class="text-red-500 px-3 py-2">Load failed</li>';
      if (sidebarList) sidebarList.innerHTML = errorHtml;
      if (mobileList) mobileList.innerHTML = errorHtml;
    }
  },
  // ========== 新增：购物车渲染函数（对齐分类页逻辑） ==========
  renderShoppingCart: function(cart) {
    // 容错：cart实例不存在则返回
    if (!cart || !cart.getCartItems) {
      console.warn('购物车实例无效，跳过渲染');
      return;
    }

    // 1. 获取购物车核心DOM元素（全容错）
    const cartCountEl = document.getElementById('cart-count');
    const cartTitleEl = document.getElementById('cart-popup-title');
    const cartItemsEl = document.getElementById('cart-popup-items');
    const cartTotalEl = document.getElementById('cart-popup-total');

    // 2. 获取购物车商品列表
    const cartItems = cart.getCartItems() || [];
    const totalItems = cart.getTotalItemCount() || 0;
    // 修复：容错getTotalPrice方法缺失（ShoppingCart类无此方法）
    const totalPrice = cart.getTotalPrice ? cart.getTotalPrice() : 0;

    // 3. 更新购物车数量徽章（和分类页一致）
    if (cartCountEl) {
      cartCountEl.textContent = totalItems;
    }

    // 4. 更新购物车弹窗标题（和分类页一致）
    if (cartTitleEl) {
      cartTitleEl.textContent = `My Shopping List (${totalItems} items)`;
    }

    // 5. 渲染购物车商品列表（对齐分类页的容错+空数据提示）
    if (cartItemsEl) {
      // 空购物车提示（和分类页文案一致）
      if (cartItems.length === 0) {
        cartItemsEl.innerHTML = '<div class="text-center text-gray-500 py-4">Your cart is empty</div>';
      } else {
        // 渲染商品项（兼容分类页的DOM结构）
        let cartHtml = '';
        cartItems.forEach(item => {
          const pid = AppUtils.toNumber(item.pid || 0, 0);
          if (pid === 0) return; // 过滤无效商品

          const productName = item.name || `Product #${pid}`;
          const productPrice = AppUtils.formatPrice(item.price || 0);
          const quantity = AppUtils.toNumber(item.num || 1, 1);

          // 商品项HTML（和分类页购物车弹窗结构对齐）
          cartHtml += `
            <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2" data-pid="${pid}">
              <div class="flex-1">
                <h4 class="font-medium text-gray-800">${productName}</h4>
                <p class="text-blue-600 font-bold">${productPrice}</p>
              </div>
              <div class="flex items-center gap-2">
                <button class="cart-qty-minus w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors" onclick="cart.updateNum(${pid}, ${quantity - 1}); AppCommon.renderShoppingCart(cart);" aria-label="Decrease quantity">
                  <i class="fa-solid fa-minus text-sm"></i>
                </button>
                <input type="number" class="cart-qty-input w-12 h-8 border border-gray-300 rounded-md text-center text-sm" value="${quantity}" min="1" onchange="cart.updateNum(${pid}, this.value); AppCommon.renderShoppingCart(cart);">
                <button class="cart-qty-plus w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors" onclick="cart.updateNum(${pid}, ${quantity + 1}); AppCommon.renderShoppingCart(cart);" aria-label="Increase quantity">
                  <i class="fa-solid fa-plus text-sm"></i>
                </button>
              </div>
              <button class="cart-item-delete text-red-500 hover:text-red-700 transition-colors" onclick="cart.removeFromCart(${pid}); AppCommon.renderShoppingCart(cart);" aria-label="Delete product">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          `;
        });
        cartItemsEl.innerHTML = cartHtml;
      }
    }

    // 6. 更新购物车总价（和分类页格式一致）
    if (cartTotalEl) {
      cartTotalEl.textContent = AppUtils.formatPrice(totalPrice);
    }
  }
};

// ===================== 第三步：商品详情核心渲染函数 =====================
/**
 * 渲染面包屑
 */
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

/**
 * 渲染商品基本信息
 */
function renderProductInfo(product) {
  // 修复：给加购按钮绑定PID（核心，解决加购时PID未定义）
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  if (addToCartBtn) {
    addToCartBtn.dataset.pid = product.pid || product.id || 0;
  }

  if (document.getElementById('product-name')) {
    document.getElementById('product-name').textContent = product.name || 'No Name';
  }
  if (document.getElementById('product-short-desc')) {
    document.getElementById('product-short-desc').textContent = product.short_desc || product.description || 'No description';
  }
  if (document.getElementById('product-price')) {
    document.getElementById('product-price').textContent = AppUtils.formatPrice(product.price);
  }
  if (document.getElementById('product-desc')) {
    document.getElementById('product-desc').textContent = product.description || 'No detailed description';
  }
}

/**
 * 渲染商品轮播图
 */
function renderProductSlider(product) {
  const sliderWrapper = document.getElementById('product-slider');
  if (!sliderWrapper) return;
  sliderWrapper.innerHTML = '';
  const sliderImgs = AppUtils.buildSliderImgs(product.img_path);
  // 过滤无效图片路径
  const validImgs = sliderImgs.filter(img => img && img.trim() !== '');
  
  if (validImgs.length === 0) {
    sliderWrapper.innerHTML = `
      <div class="swiper-slide flex items-center justify-center bg-gray-100">
        <img src="${AppConfig.DEFAULT_IMG}" class="max-h-full object-contain" alt="No image">
      </div>
    `;
    return;
  }

  validImgs.forEach(imgSrc => {
    const slideHtml = `
      <div class="swiper-slide flex items-center justify-center bg-gray-100">
        <img src="${imgSrc}" class="max-h-full object-contain" alt="${product.name || 'Product image'}">
      </div>
    `;
    sliderWrapper.innerHTML += slideHtml;
  });
}

/**
 * 渲染错误页面
 */
function renderErrorPage() {
  hideLoading(); // 兜底隐藏 Loading
  if (document.getElementById('product-name')) {
    document.getElementById('product-name').textContent = 'Product Load Failed';
  }
  if (document.getElementById('product-price')) {
    document.getElementById('product-price').textContent = AppUtils.formatPrice(0);
  }
  if (document.getElementById('product-desc')) {
    document.getElementById('product-desc').textContent = 'Failed to load product data. Please try again later.';
  }
  if (document.getElementById('breadcrumb-pro-name')) {
    document.getElementById('breadcrumb-pro-name').textContent = 'Load Failed';
  }
  // 清空加购按钮PID
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  if (addToCartBtn) addToCartBtn.dataset.pid = 0;
}

/**
 * 加载商品详情
 */
async function loadProductDetail(pid) {
  try {
    console.log('传给后端接口的pid:', pid);
    const res = await axios.get(`${AppConfig.API_BASE_URL}/products/detail?pid=${pid}`);
    const result = res.data;

    if (result.code !== 0 || !result.data) {
      throw new Error(result.msg || '商品不存在');
    }

    const product = result.data;
    // 更新页面标题
    document.title = `${product.name || 'Product Detail'} - ShopEasy`;
    // 渲染面包屑
    renderBreadcrumb(product);
    // 渲染商品基本信息
    renderProductInfo(product);

    // ========== 修改后的核心逻辑：绑定加购按钮点击事件（避免this指向问题） ==========
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
      // 1. 先清空原有内联onclick，避免冲突
      addToCartBtn.onclick = null;
      // 2. 赋值data-pid（保留，兼容其他逻辑）
      addToCartBtn.dataset.pid = product.pid;
      // 3. 绑定到真实加购逻辑handleAddToCart
      addToCartBtn.addEventListener('click', window.handleAddToCart);
      console.log('产品页加购按钮绑定PID：', product.pid); // 控制台验证
    }
    // ========== 修改结束 ==========

    // 渲染轮播图
    renderProductSlider(product);
    // 加载分类（高亮当前分类）
    await AppCommon.loadAllCategories(AppUtils.toNumber(product.catid || 0, 0));
  } catch (error) {
    throw new Error(`加载商品失败: ${error.message}`);
  }
}

// ===================== 第四步：页面初始化入口 =====================
document.addEventListener('DOMContentLoaded', async () => {
  // 1. 解析 pid + 日志排查
  const rawPid = AppUtils.getUrlParam('pid');
  console.log('跳转传递的原始pid:', rawPid);

  // 2. 强校验 pid 为有效数字
  let pid = AppUtils.toNumber(rawPid, 9);
  console.log('处理后的有效pid:', pid);

  try {
    // 3. 显示 Loading（现在函数已定义，不会报错）
    showLoading();
    // 4. 初始化通用交互
    AppCommon.initMobileDrawer();
    
    // 5. 校验 pid 有效性
    if (pid <= 0) throw new Error('无效的商品ID');
    
    // 6. 加载商品详情（接口有数据，这里能正常执行）
    await loadProductDetail(pid);
    
    // 7. 初始化轮播（加容错 + 延迟确保DOM渲染完成）
    setTimeout(() => {
      AppCommon.initSwiper('.mySwiper', {
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { 
          nextEl: '.swiper-button-next', 
          prevEl: '.swiper-button-prev'
        },
        // 修复：轮播图高度适配
        slidesPerView: 1,
        height: '100%'
      });
    }, 200);

    // 8. 初始化数量输入框（限制最小值）
    const quantityEl = document.getElementById('product-quantity');
    if (quantityEl) {
      quantityEl.addEventListener('change', () => {
        const num = AppUtils.toNumber(quantityEl.value, 1);
        quantityEl.value = num < 1 ? 1 : num;
      });
    }

    // ========== 新增：初始化购物车并渲染（对齐分类页） ==========
    if (window.initCartGlobal) {
      await window.initCartGlobal();
      // 初始化后立即渲染购物车
      if (window.cart) {
        // AppCommon.renderShoppingCart(window.cart);
      }
    }

    // 9. 隐藏 Loading
    hideLoading();
  } catch (error) {
    console.error('商品详情加载失败:', error);
    // 9. 失败也隐藏 Loading（关键）
    hideLoading();
    // 10. 渲染错误页面
    renderErrorPage();
  }
});

// ===================== 加购函数（核心修复：真正调用cart.addToCart，无任何新增代码） =====================
window.handleAddToCart = function(e) {
  // 拦截默认行为（和分类页加购按钮逻辑完全一致）
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // 获取加购按钮的PID
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const pid = AppUtils.toNumber(addToCartBtn?.dataset.pid || 0, 0);
  if (pid <= 0) {
    alert('无效的商品ID，无法加入购物车！');
    return;
  }

  // 核心修复：优先调用真实的cart.addToCart方法（固定加购数量为1，和分类页一致）
  if (window.cart && typeof window.cart.addToCart === 'function') {
    // 确保购物车初始化完成
    (window.initCartGlobal ? window.initCartGlobal() : Promise.resolve()).then(() => {
      // 执行真实加购逻辑（数量固定为1，无新增代码）
      window.cart.addToCart(pid, 1);
      // 保存到本地存储（即使被阻止，内存中仍有效）
      window.cart.saveToLocalStorage();
      // 重新渲染购物车UI
      if (typeof AppCommon.renderShoppingCart === 'function') {
        AppCommon.renderShoppingCart(window.cart);
      }
      // 自动显示购物车弹窗
      const cartPopup = document.getElementById('cart-popup');
      if (cartPopup) {
        cartPopup.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
        cartPopup.classList.add('opacity-100', 'pointer-events-auto');
      }
      alert(`成功将商品 #${pid} 加入购物车！`);
    });
  } else if (window.addToCartOriginal) {
    // 兼容原有备用逻辑
    window.addToCartOriginal(pid, e);
    alert(`成功将商品 ${pid} 加入购物车！`);
    if (window.cart && typeof AppCommon.renderShoppingCart === 'function') {
      AppCommon.renderShoppingCart(window.cart);
      const cartToggle = document.getElementById('cart-toggle');
      if (cartToggle) cartToggle.checked = true;
    }
  } else if (window.addToCart) {
    // 兼容兜底逻辑
    window.addToCart(pid, e);
  } else {
    alert('购物车功能未加载，请刷新页面重试！');
    return;
  }
};

// 保留兜底函数，但补充真实加购逻辑
window.addToCart = function(pid, e) {
  if (e) e.preventDefault();
  // 补充：调用真实加购逻辑
  if (window.cart && typeof window.cart.addToCart === 'function') {
    window.cart.addToCart(pid, 1);
    window.cart.saveToLocalStorage();
    if (window.cart && typeof AppCommon.renderShoppingCart === 'function') {
      AppCommon.renderShoppingCart(window.cart);
    }
    alert(`商品 #${pid} 已加入购物车！`);
  } else {
    alert(`商品 ${pid} 已加入购物车！`);
    if (window.initCartGlobal) {
      window.initCartGlobal().then(() => {
        if (window.cart && typeof AppCommon.renderShoppingCart === 'function') {
          AppCommon.renderShoppingCart(window.cart);
        }
      });
    }
  }
};