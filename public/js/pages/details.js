/**
 * Product detail page exclusive logic (with SEO URL support)
 */

// ===================== Step 1: Core product detail rendering function =====================
function renderBreadcrumb(product) {
  const cateLink = document.getElementById('breadcrumb-cate-link');
  const proName = document.getElementById('breadcrumb-pro-name');
  if (cateLink) {
    const cateId = AppUtils.toNumber(product.catid || 0, 0);
    const cateName = product.cateName || product.cate_name || 'Uncategorized';
    // Use SEO URL for category link
    const seoUrl = cateId > 0 ? `/${cateId}-${AppUtils.slugify(cateName)}` : '#';
    cateLink.href = seoUrl;
    cateLink.textContent = cateName;
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

function renderProductSlider(product) {
  const sliderWrapper = document.getElementById('product-slider');
  if (!sliderWrapper) return;
  sliderWrapper.innerHTML = '';

  let baseImgs = [];
  if (product.img_path && product.img_path.trim() !== '') {
    const imgPath = product.img_path.trim();
    const extIndex = imgPath.lastIndexOf('.');
    if (extIndex !== -1) {
      const base = imgPath.substring(0, extIndex);
      const ext = imgPath.substring(extIndex);
      baseImgs = [
        imgPath,
        `${base}2${ext}`,
        `${base}3${ext}`
      ];
    } else {
      baseImgs = [imgPath];
    }
  } else {
    baseImgs = [AppConfig.DEFAULT_IMG];
  }

  baseImgs.forEach(src => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide flex items-center justify-center bg-gray-100';

    const img = document.createElement('img');
    img.src = src;
    img.alt = product.name || 'Product image';
    img.className = 'max-h-full object-contain';
    img.onerror = function() {
      this.src = AppConfig.DEFAULT_IMG;
    };

    slide.appendChild(img);
    sliderWrapper.appendChild(slide);
  });
}

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

// ===================== Step 2: Page initialization entry =====================
document.addEventListener('DOMContentLoaded', async () => {
  // Parse SEO URL first, fallback to query parameters
  const { productId: seoPid } = AppUtils.parseSeoUrl();
  const rawPid = AppUtils.getUrlParam('pid');
  console.log('Original PID from query param:', rawPid);
  console.log('PID from SEO URL:', seoPid);
  
  // Priority: SEO URL pid > query param pid
  let pid = seoPid > 0 ? seoPid : AppUtils.toNumber(rawPid, 9);
  console.log('Final processed PID:', pid);

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