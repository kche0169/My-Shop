/**
 * Category page exclusive logic (fully functional version with infinite scroll and SEO URLs)
 */

// ===================== Step 1: Infinite Scroll State & Functions =====================
const infiniteScrollState = {
  currentPage: 1,
  limit: 8,
  isLoading: false,
  hasMore: true,
  currentCatid: null
};

function showLoadingIndicator() {
  const el = document.getElementById('loading-indicator');
  if (el) el.style.display = 'flex';
}

function hideLoadingIndicator() {
  const el = document.getElementById('loading-indicator');
  if (el) el.style.display = 'none';
}

function showEndOfResults() {
  const el = document.getElementById('end-of-results');
  if (el) el.style.display = 'block';
}

function hideEndOfResults() {
  const el = document.getElementById('end-of-results');
  if (el) el.style.display = 'none';
}

function updateScrollToTopButton() {
  const el = document.getElementById('scroll-to-top');
  if (!el) return;

  if (window.scrollY > 300) {
    el.classList.remove('opacity-0', 'invisible');
    el.classList.add('opacity-100', 'visible');
  } else {
    el.classList.add('opacity-0', 'invisible');
    el.classList.remove('opacity-100', 'visible');
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bindScrollToTopButton() {
  const el = document.getElementById('scroll-to-top');
  if (el) {
    el.addEventListener('click', scrollToTop);
  }
}

function handleScroll(catid) {
  if (infiniteScrollState.isLoading || !infiniteScrollState.hasMore) return;

  const scrollPosition = window.innerHeight + window.scrollY;
  const threshold = document.documentElement.scrollHeight - 500;

  if (scrollPosition >= threshold) {
    loadCategoryProducts(catid, false);
  }

  updateScrollToTopButton();
}

// ===================== Step 2: Category page core business functions =====================
async function loadCategoryInfo(catid) {
  try {
    const res = await axios.get(`${AppConfig.API_BASE_URL}/cate/all`);
    const categories = res.data.data || [];
    const currentCate = categories.find(cate => AppUtils.toNumber(cate.catid || cate.id, 0) === catid) || {};

    const cateName = currentCate.name || 'Unknown Category';

    document.title = `${cateName} - ShopEasy`;

    if (document.getElementById('breadcrumb-cate-name')) {
      document.getElementById('breadcrumb-cate-name').textContent = cateName;
    }

    if (document.getElementById('cate-name')) {
      document.getElementById('cate-name').textContent = cateName;
    }

    if (document.getElementById('cate-desc')) {
      document.getElementById('cate-desc').textContent = currentCate.description || `Explore all products in ${cateName} category`;
    }

    await AppCommon.loadAllCategories(catid);
  } catch (error) {
    throw new Error(`Failed to load category info: ${error.message}`);
  }
}

async function loadCategoryProducts(catid, reset = true) {
  if (reset) {
    infiniteScrollState.currentPage = 1;
    infiniteScrollState.hasMore = true;
    infiniteScrollState.currentCatid = catid;
    hideEndOfResults();
  }

  if (infiniteScrollState.isLoading || !infiniteScrollState.hasMore) return;

  infiniteScrollState.isLoading = true;
  
  if (reset) {
    showLoading();
  } else {
    showLoadingIndicator();
  }

  try {
    const url = `${AppConfig.API_BASE_URL}/products/list?catid=${catid}&page=${infiniteScrollState.currentPage}&limit=${infiniteScrollState.limit}`;
    const res = await axios.get(url);
    const products = res.data.data || [];
    const pagination = res.data.pagination || {};
    const productListEl = document.getElementById('product-list');

    if (!productListEl) {
      console.warn('Product list container #product-list not found');
      hideLoading();
      hideLoadingIndicator();
      infiniteScrollState.isLoading = false;
      return;
    }

    if (products.length === 0 && infiniteScrollState.currentPage === 1) {
      productListEl.innerHTML = `
        <div class="col-span-full text-center text-gray-500 py-8">
          <i class="fa-solid fa-box-open text-4xl mb-3"></i>
          <p>No products found in this category</p>
        </div>
      `;
      hideLoading();
      hideLoadingIndicator();
      infiniteScrollState.isLoading = false;
      infiniteScrollState.hasMore = false;
      return;
    }

    let productHtml = '';
    products.forEach(pro => {
      const validPid = AppUtils.toNumber(pro.pid || pro.id, 0);
      if (validPid === 0) return;

      let imgSrc = pro.img_path || AppConfig.DEFAULT_IMG;
      if (imgSrc && !imgSrc.includes('.') && imgSrc !== AppConfig.DEFAULT_IMG) {
        imgSrc = `${imgSrc}/thumb.jpg`;
      }
      
      const proName = pro.name || 'Unnamed Product';
      const proDesc = pro.description || 'No product description available';
      const proPrice = AppUtils.formatPrice(pro.price);
      const cateName = pro.cateName || 'Category';
      
      // Generate SEO-friendly URL: /{catId}-{categoryName}/{productId}-{productName}
      const seoUrl = `/${catid}-${AppUtils.slugify(cateName)}/${validPid}-${AppUtils.slugify(proName)}`;

      productHtml += `
        <div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
          <a href="${seoUrl}" class="block">
            <img src="${imgSrc}" alt="${proName}" class="w-full h-48 object-contain p-4 bg-gray-50"
                 onerror="this.src='${AppConfig.DEFAULT_IMG}'">
          </a>
          <div class="p-4 flex-1">
            <a href="${seoUrl}" class="block">
              <h3 class="text-lg font-medium text-gray-800 mb-2 line-clamp-1 hover:text-blue-600">${proName}</h3>
              <p class="text-gray-600 text-sm mb-4 line-clamp-2">${proDesc}</p>
              <p class="text-blue-600 font-bold text-xl mb-4">${proPrice}</p>
            </a>
          </div>
          <button 
            class="mt-auto bg-blue-600 text-white py-2 px-4 rounded-b-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            onclick="addToCart(${validPid}, event); event.preventDefault(); event.stopPropagation();"
            data-pid="${validPid}">
            <i class="fa-solid fa-cart-shopping mr-2"></i> Add to Cart
          </button>
        </div>
      `;
    });

    if (reset) {
      productListEl.innerHTML = productHtml;
    } else {
      productListEl.insertAdjacentHTML('beforeend', productHtml);
    }

    infiniteScrollState.hasMore = pagination.hasNextPage || false;
    infiniteScrollState.currentPage++;

    if (!infiniteScrollState.hasMore) {
      showEndOfResults();
    }

  } catch (error) {
    console.error(`Failed to load category products: ${error.message}`);
    if (infiniteScrollState.currentPage === 1 && document.getElementById('product-list')) {
      document.getElementById('product-list').innerHTML = `
        <div class="col-span-full text-center text-red-500 py-8">
          <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
          <p>Failed to load products. Please try again later.</p>
        </div>
      `;
    }
  } finally {
    infiniteScrollState.isLoading = false;
    hideLoading();
    hideLoadingIndicator();
  }
}

function renderErrorPage() {
  if (document.getElementById('cate-name')) {
    document.getElementById('cate-name').textContent = 'Unknown Category';
  }
  if (document.getElementById('breadcrumb-cate-name')) {
    document.getElementById('breadcrumb-cate-name').textContent = 'Unknown';
  }
  if (document.getElementById('product-list')) {
    document.getElementById('product-list').innerHTML = `
      <div class="col-span-full text-center text-red-500 py-8">
        <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
        <p>Failed to load category data</p>
      </div>
    `;
  }
}

// ===================== Step 3: Page initialization entry =====================
document.addEventListener('DOMContentLoaded', async () => {
  const { catid } = AppUtils.parseSeoUrl();

  try {
    AppCommon.initMobileDrawer();
    bindScrollToTopButton();
    
    if (catid <= 0) {
      throw new Error('Invalid category ID');
    }
    
    await loadCategoryInfo(catid);
    await loadCategoryProducts(catid, true);

    window.addEventListener('scroll', () => handleScroll(catid));
    
  } catch (error) {
    console.error('Category page initialization failed:', error);
    renderErrorPage();
    hideLoading();
  }
});