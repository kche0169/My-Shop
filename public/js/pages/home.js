/**
 * 主页专属逻辑
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. 初始化通用交互
    AppCommon.initMobileDrawer();
    
    // 2. 初始化主页轮播
    AppCommon.initSwiper('.slider-swiper', {
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      pagination: { el: '.swiper-pagination', clickable: true }
    });
    
    // 3. 加载主页分类
    await AppCommon.loadAllCategories();
    
    // 4. 加载主页推荐商品
    await loadHomeProducts();
  } catch (error) {
    console.error('主页加载失败:', error);
  }
});

/**
 * 加载主页推荐商品
 */
async function loadHomeProducts() {
  try {
    // 加载不同板块的商品（可根据需求调整）
    await loadSectionProducts('Limited Time Deals', 1); // 电子产品
    await loadSectionProducts('Recommended for You', 3); // 运动户外
    await loadSectionProducts('New Arrivals', 2); // 家居生活
  } catch (error) {
    console.error('加载主页商品失败:', error);
  }
}

/**
 * 加载指定板块的商品
 * @param {string} sectionTitle - 板块标题
 * @param {number} catid - 分类ID
 */
async function loadSectionProducts(sectionTitle, catid) {
  try {
    showLoading();
    const res = await axios.get(`${AppConfig.API_BASE_URL}/products/list?catid=${catid}`);
    const products = res.data.data || [];
    const sectionEl = document.querySelector(`section:has(h2:contains("${sectionTitle}")) .grid`);

    if (!sectionEl || products.length === 0) {
      hideLoading();
      return;
    }

    let productHtml = '';
    products.slice(0, 4).forEach(pro => {
      // 👇 核心：强制校验pid为数字
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
    console.error(`加载${sectionTitle}商品失败: ${error.message}`);
    hideLoading();
  }
}