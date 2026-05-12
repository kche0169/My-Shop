/**
 * Infinite Scroll Module
 * Implements AJAX infinite scroll for product listing
 */

(function() {
  'use strict';

  const state = {
    currentPage: 1,
    limit: 8,
    isLoading: false,
    hasMore: true,
    currentCatid: null,
    totalProducts: 0
  };

  const elements = {
    productGrid: null,
    loadingIndicator: null,
    endOfResults: null,
    productCount: null,
    categoryFilters: null,
    scrollToTop: null
  };

  const templates = {};

  function init() {
    cacheElements();
    loadTemplates();
    bindEvents();
    loadCategories();
    loadProducts(true);
  }

  function cacheElements() {
    elements.productGrid = document.getElementById('product-grid');
    elements.loadingIndicator = document.getElementById('loading-indicator');
    elements.endOfResults = document.getElementById('end-of-results');
    elements.productCount = document.getElementById('product-count');
    elements.categoryFilters = document.getElementById('category-filters');
    elements.scrollToTop = document.getElementById('scroll-to-top');
  }

  function loadTemplates() {
    const template = document.getElementById('product-card-template');
    if (template) {
      templates.productCard = template.innerHTML;
    }
  }

  function bindEvents() {
    window.addEventListener('scroll', handleScroll);
    elements.scrollToTop?.addEventListener('click', scrollToTop);
    
    elements.categoryFilters?.addEventListener('click', (e) => {
      if (e.target.classList.contains('category-filter-btn')) {
        handleCategoryFilter(e.target);
      }
    });
  }

  function handleScroll() {
    if (state.isLoading || !state.hasMore) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 500;

    if (scrollPosition >= threshold) {
      loadProducts(false);
    }

    updateScrollToTopButton();
  }

  function updateScrollToTopButton() {
    if (!elements.scrollToTop) return;

    if (window.scrollY > 300) {
      elements.scrollToTop.classList.remove('opacity-0', 'invisible');
      elements.scrollToTop.classList.add('opacity-100', 'visible');
    } else {
      elements.scrollToTop.classList.add('opacity-0', 'invisible');
      elements.scrollToTop.classList.remove('opacity-100', 'visible');
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async function loadCategories() {
    try {
      const response = await fetch(`${AppConfig.API_BASE_URL}/api/cate/all`);
      const result = await response.json();

      if (result.code === 0 && result.data) {
        renderCategoryFilters(result.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  function renderCategoryFilters(categories) {
    if (!elements.categoryFilters) return;

    let html = `
      <button class="category-filter-btn px-4 py-2 rounded-full text-sm font-medium bg-blue-600 text-white" data-catid="">
        All
      </button>
    `;

    categories.forEach(cat => {
      html += `
        <button class="category-filter-btn px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors" data-catid="${cat.catid}">
          ${cat.name}
        </button>
      `;
    });

    elements.categoryFilters.innerHTML = html;
  }

  function handleCategoryFilter(button) {
    const catid = button.dataset.catid;

    document.querySelectorAll('.category-filter-btn').forEach(btn => {
      btn.classList.remove('bg-blue-600', 'text-white');
      btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    button.classList.remove('bg-gray-100', 'text-gray-700');
    button.classList.add('bg-blue-600', 'text-white');

    state.currentCatid = catid || null;
    state.currentPage = 1;
    state.hasMore = true;

    elements.productGrid.innerHTML = '';
    loadProducts(true);
  }

  async function loadProducts(reset = false) {
    if (state.isLoading) return;

    if (reset) {
      state.currentPage = 1;
      state.hasMore = true;
      elements.productGrid.innerHTML = '';
    }

    state.isLoading = true;
    elements.loadingIndicator.style.display = 'flex';
    elements.endOfResults.style.display = 'none';

    try {
      let url = `${AppConfig.API_BASE_URL}/api/products/list?page=${state.currentPage}&limit=${state.limit}`;
      if (state.currentCatid) {
        url += `&catid=${state.currentCatid}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.code === 0) {
        const { data, pagination } = result;

        if (reset) {
          state.totalProducts = pagination.total;
          elements.productCount.textContent = `${pagination.total} products found`;
        }

        renderProducts(data);

        state.hasMore = pagination.hasNextPage;
        state.currentPage++;

        if (!state.hasMore) {
          elements.endOfResults.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      state.isLoading = false;
      elements.loadingIndicator.style.display = 'none';
    }
  }

  function renderProducts(products) {
    if (!products || products.length === 0) {
      if (state.currentPage === 1) {
        elements.productGrid.innerHTML = `
          <div class="col-span-full text-center py-12 text-gray-500">
            No products found
          </div>
        `;
      }
      return;
    }

    let html = '';
    products.forEach(product => {
      let cardHtml = templates.productCard
        .replace(/\${pid}/g, product.pid)
        .replace(/\${name}/g, escapeHtml(product.name))
        .replace(/\${cateName}/g, escapeHtml(product.cateName || ''))
        .replace(/\${price}/g, product.price.toFixed(2))
        .replace(/\${img_path}/g, product.img_path || '../images/placeholder.jpg');

      html += cardHtml;
    });

    elements.productGrid.insertAdjacentHTML('beforeend', html);

    bindAddToCartButtons();
  }

  function bindAddToCartButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const pid = parseInt(btn.dataset.pid);
        if (!pid) return;

        try {
          if (typeof Cart !== 'undefined' && Cart.addItem) {
            Cart.addItem(pid, 1);
            showNotification('Product added to cart!', 'success');
          } else {
            console.warn('Cart module not loaded');
          }
        } catch (error) {
          console.error('Failed to add to cart:', error);
          showNotification('Failed to add to cart', 'error');
        }
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();