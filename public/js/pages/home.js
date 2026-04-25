/**
 * Home page exclusive logic
 * Core modification: Integrate duplicate code + Unify real-time update logic + Compatible with original loading logic
 */

// Reuse existing API configuration (no need to redefine baseUrl)
// const baseUrl = AppConfig.API_BASE_URL; 

// ==================== Original core logic (reserved + fine-tuned) ====================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Initialize common interactions
    AppCommon.initMobileDrawer();
    
    // 2. Initialize home page swiper
    AppCommon.initSwiper('.slider-swiper', {
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      pagination: { el: '.swiper-pagination', clickable: true }
    });
    
    // 3. Load home page categories (内部已自动渲染，无需重复调用)
    await AppCommon.loadAllCategories();
    
    // 4. Load home page recommended products
    await loadHomeProducts();
    
    // 5. Load new products with PID>33 (core addition)
    await loadPidOver33Products();

  } catch (error) {
    console.error('Home page loading failed:', error);
  }
});

/**
 * Load home page recommended products (original logic reserved)
 */
async function loadHomeProducts() {
  try {
    // Load products for different sections (adjustable)
    await loadSectionProducts('Limited Time Deals', 1); // Electronics
    await loadSectionProducts('Recommended for You', 3); // Sports & Outdoor
    await loadSectionProducts('New Arrivals', 2); // Home & Living
  } catch (error) {
    console.error('Failed to load home page products:', error);
  }
}

/**
 * Load products for specified section
 * @param {string} sectionTitle - Section title
 * @param {number} catid - Category ID
 */
async function loadSectionProducts(sectionTitle, catid) {
  try {
    showLoading();
    const res = await axios.get(`${AppConfig.API_BASE_URL}/products/list?catid=${catid}`);
    const products = res.data.data || [];
    
    // 🔴 修复：替换 jQuery 风格选择器，使用原生 JS 遍历查找
    let sectionEl = null;
    const allSections = document.querySelectorAll('section');
    for (const sec of allSections) {
      const h2 = sec.querySelector('h2');
      if (h2 && h2.textContent.trim().includes(sectionTitle)) {
        sectionEl = sec.querySelector('.grid');
        break;
      }
    }

    if (!sectionEl || products.length === 0) {
      hideLoading();
      return;
    }

    let productHtml = '';
    products.slice(0, 4).forEach(pro => {
      // Core: Force validate pid as number
      const validPid = AppUtils.toNumber(pro.pid, 0);
      if (validPid === 0) return;

      const imgSrc = pro.img_path || AppConfig.DEFAULT_IMG;
      productHtml += `
        <a href="${AppConfig.PAGE_PATHS.PRODUCT_DETAIL}?pid=${validPid}" class="block group">
          <div class="product-card">
            <div class="product-image-wrapper">
              <img src="${imgSrc}" alt="${pro.name || 'Product'}" class="product-image">
            </div>
            <h3 class="text-lg font-medium text-gray-800 mb-2">${pro.name || 'No Name'}</h3>
            <p class="text-gray-600 text-sm mb-4 flex-grow line-clamp-2">${pro.description || 'No description'}</p>
            <p class="text-blue-600 font-bold text-xl mb-4">${AppUtils.formatPrice(pro.price)}</p>
            <button class="btn-add-to-cart" onclick="addToCart(${validPid}, event)">
              <i class="fa-solid fa-cart-shopping mr-2"></i>Add to Cart
            </button>
          </div>
        </a>
      `;
    });

    sectionEl.innerHTML = productHtml;
    hideLoading();
  } catch (error) {
    console.error(`Failed to load ${sectionTitle} products: ${error.message}`);
    hideLoading();
  }
}

// ==================== New: Load products with PID>33 (optimized version) ====================
/**
 * Load products with PID>33, render to new-arrivals-dynamic container
 */
async function loadPidOver33Products() {
  try {
    showLoading(); 
    // Reuse original list API (no need to add new backend API)
    const res = await axios.get(`${AppConfig.API_BASE_URL}/products/list`);
    const allProducts = res.data.data || [];
    // Filter condition: PID>33
    const newProducts = allProducts.filter(pro => AppUtils.toNumber(pro.pid, 0) > 33);
    const dynamicContainer = document.getElementById('new-arrivals-dynamic');

    if (!dynamicContainer) {
      hideLoading();
      return;
    }

    // Clear container when no products with PID>33 (avoid layout impact)
    if (newProducts.length === 0) {
      dynamicContainer.innerHTML = '';
      hideLoading();
      return;
    }

    // Dynamically generate product cards (reuse original style, add New badge)
    let dynamicHtml = '';
    newProducts.forEach(pro => {
      const validPid = AppUtils.toNumber(pro.pid, 0);
      if (validPid <= 33) return;

      // Prioritize thumbnail, compatible with new/old product paths
      const imgSrc = pro.img_thumb || pro.img_path || `${pro.img_path}/thumb.jpg` || AppConfig.DEFAULT_IMG;
      dynamicHtml += `
        <a href="${AppConfig.PAGE_PATHS.PRODUCT_DETAIL}?pid=${validPid}" class="block group">
          <div class="product-card">
            <div class="product-image-wrapper relative">
              <!-- New: Add New badge to distinguish new products -->
              <span class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">New</span>
              <img src="${imgSrc}" alt="${pro.name || 'New Product'}" class="product-image"
                   onerror="this.src='${AppConfig.DEFAULT_IMG}'">
            </div>
            <h3 class="text-lg font-medium text-gray-800 mb-2">${pro.name || 'No Name'}</h3>
            <p class="text-gray-600 text-sm mb-4 flex-grow line-clamp-2">${pro.description || 'No description'}</p>
            <p class="text-blue-600 font-bold text-xl mb-4">${AppUtils.formatPrice(pro.price)}</p>
            <button class="btn-add-to-cart" onclick="addToCart(${validPid}, event)">
              <i class="fa-solid fa-cart-shopping mr-2"></i>Add to Cart
            </button>
          </div>
        </a>
      `;
    });

    dynamicContainer.innerHTML = dynamicHtml;
    hideLoading();
  } catch (error) {
    console.error('Failed to load products with PID>33:', error.message);
    const dynamicContainer = document.getElementById('new-arrivals-dynamic');
    if (dynamicContainer) {
      dynamicContainer.innerHTML = '<div class="text-center text-red-500 py-4 col-span-full">Failed to load new products</div>';
    }
    hideLoading();
  }
}

// ==================== Enhanced: Category rendering (compatible + unified logic) ====================
function renderCategoryList() {
  axios.get(`${AppConfig.API_BASE_URL}/cate/all`).then(res => {
    const cateList = res.data.data || [];
    const mobileCateList = document.getElementById('mobile-cate-list');
    const desktopCateList = document.getElementById('desktop-cate-list');
    
    // 🔴 修复：仅在元素存在时执行后续操作
    if (mobileCateList) {
      mobileCateList.innerHTML = '';
      if (cateList.length === 0) {
        mobileCateList.innerHTML = '<li class="text-gray-500 px-3 py-2">No categories available</li>';
      } else {
        cateList.forEach(cate => {
          const mobileLi = document.createElement('li');
          mobileLi.innerHTML = `
            <a href="${AppConfig.PAGE_PATHS.CATEGORY_DETAIL}?catid=${cate.catid}" 
               class="block px-3 py-2 rounded-md hover:bg-blue-100 hover:text-blue-600 transition-colors">
              ${cate.name}
            </a>
          `;
          mobileCateList.appendChild(mobileLi);
        });
      }
    }

    if (desktopCateList) {
      desktopCateList.innerHTML = '';
      if (cateList.length === 0) {
        desktopCateList.innerHTML = '<li class="text-gray-500 px-3 py-2">No categories available</li>';
      } else {
        cateList.forEach(cate => {
          const desktopLi = document.createElement('li');
          desktopLi.innerHTML = `
            <a href="${AppConfig.PAGE_PATHS.CATEGORY_DETAIL}?catid=${cate.catid}"
               class="block px-3 py-2 rounded-md text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors">
              ${cate.name}
            </a>
          `;
          desktopCateList.appendChild(desktopLi);
        });
      }
    }
  }).catch(err => {
    console.error('Failed to load category list：', err);
    // 🔴 修复：同样先判断元素存在
    const mobileCateList = document.getElementById('mobile-cate-list');
    const desktopCateList = document.getElementById('desktop-cate-list');
    if (mobileCateList) mobileCateList.innerHTML = '<li class="text-red-500 px-3 py-2">Failed to load categories</li>';
    if (desktopCateList) desktopCateList.innerHTML = '<li class="text-red-500 px-3 py-2">Failed to load categories</li>';
  });
}

// ==================== Core: Real-time update logic (unified listener + avoid duplication) ====================
function initRealTimeUpdate() {
  // Remove duplicate storage listener, keep only one unified listener
  window.removeEventListener('storage', handleStorageUpdate); 
  window.addEventListener('storage', handleStorageUpdate);
}

/**
 * Unified handling of storage update events
 * @param {StorageEvent} e - Storage event
 */
function handleStorageUpdate(e) {
  if (e.key === 'cateUpdated') {
    // Category updated: Refresh category list
    AppCommon.loadAllCategories(); 
    renderCategoryList();          
  }
  if (e.key === 'proUpdated') {
    // Product updated: Refresh PID>33 products + Refresh original New Arrivals products
    loadPidOver33Products();       
    loadSectionProducts('New Arrivals', 2); 
  }
}

// ==================== Initialize real-time update listener ====================
initRealTimeUpdate();

// ==================== Tool functions (supplement if undefined in project) ====================
// Supplement basic implementation if showLoading/hideLoading not defined (adjustable by UI)
function showLoading() {
  const loadingEl = document.createElement('div');
  loadingEl.id = 'home-loading';
  loadingEl.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    z-index: 9999; padding: 10px 20px; background: rgba(0,0,0,0.7); color: white; border-radius: 4px;
  `;
  loadingEl.innerText = 'Loading...';
  document.body.appendChild(loadingEl);
}

function hideLoading() {
  const loadingEl = document.getElementById('home-loading');
  if (loadingEl) loadingEl.remove();
}