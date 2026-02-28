/**
 * 分类页专属逻辑（完整可用版）
 * 功能：加载分类列表、加载分类商品、加购功能（兼容全局购物车）、Loading状态、移动端抽屉
 * 修复：路径错误、函数覆盖、a标签跳转拦截、DOM容错、数据校验
 */

// ===================== 第一步：核心工具函数定义（避免未定义报错） =====================
// 显示全局Loading
window.showLoading = function() {
  let loadingEl = document.getElementById('global-loading');
  if (!loadingEl) {
    loadingEl = document.createElement('div');
    loadingEl.id = 'global-loading';
    loadingEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center;
      z-index: 9999; font-size: 18px; color: #165DFF; gap: 12px;
    `;
    loadingEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-2xl"></i> Loading...';
    document.body.appendChild(loadingEl);
  }
  loadingEl.style.display = 'flex';
};

// 隐藏全局Loading
window.hideLoading = function() {
  const loadingEl = document.getElementById('global-loading');
  if (loadingEl) loadingEl.style.display = 'none';
};

// ===================== 第二步：全局配置/工具兜底（防止依赖缺失） =====================
// 全局配置（适配实际项目路径，根据你的部署调整）
window.AppConfig = window.AppConfig || {
  API_BASE_URL: 'http://localhost:3000/api', // 后端API地址
  DEFAULT_IMG: 'https://via.placeholder.com/200x200?text=No+Image', // 默认商品图
  PAGE_PATHS: {
    CATEGORY_DETAIL: '/pages/category/detail.html', // 分类页路径（相对根目录）
    PRODUCT_DETAIL: '/pages/product/detail.html'    // 商品详情页路径（相对根目录）
  }
};

// 全局工具函数（兜底，避免依赖utils.js缺失）
window.AppUtils = window.AppUtils || {
  // 解析URL参数
  getUrlParam: function(key) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(key);
  },
  // 转为数字（带兜底）
  toNumber: function(value, defaultValue = 1) {
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : num;
  },
  // 格式化价格（保留2位小数）
  formatPrice: function(price) {
    const num = parseFloat(price) || 0;
    return `$${num.toFixed(2)}`;
  }
};

// 全局通用逻辑（兜底，避免依赖common.js缺失）
window.AppCommon = window.AppCommon || {
  // 初始化移动端分类抽屉
  initMobileDrawer: function() {
    const mobileCateBtn = document.getElementById('mobile-category-btn');
    const mobileCateDrawer = document.getElementById('mobile-category-drawer');
    const mobileCateClose = document.getElementById('mobile-category-close');

    // 容错：DOM元素不存在则跳过
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

  // 加载所有分类（侧边栏+移动端）
  loadAllCategories: async function(activeCatId) {
    try {
      const res = await axios.get(`${AppConfig.API_BASE_URL}/cate/all`);
      const categories = res.data.data || [];
      const sidebarList = document.getElementById('sidebar-cate-list');
      const mobileList = document.getElementById('mobile-cate-list');
      
      // 容错：容器不存在则返回
      if (!sidebarList || !mobileList) return;

      // 无分类提示
      if (categories.length === 0) {
        const emptyHtml = '<li class="text-gray-500 px-3 py-2">No categories available</li>';
        sidebarList.innerHTML = emptyHtml;
        mobileList.innerHTML = emptyHtml;
        return;
      }

      // 渲染分类列表（高亮当前分类）
      let cateHtml = '';
      categories.forEach(cate => {
        const cateId = AppUtils.toNumber(cate.catid || cate.id, 0);
        if (cateId === 0) return; // 无效分类ID跳过

        const isActive = cateId === activeCatId;
        cateHtml += `
          <a href="${AppConfig.PAGE_PATHS.CATEGORY_DETAIL}?catid=${cateId}" 
             class="block px-3 py-2 rounded-md transition-colors ${
               isActive ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-600 hover:bg-blue-100 hover:text-blue-600'
             }">
              ${cate.name || 'Unnamed Category'}
          </a>
        `;
      });

      sidebarList.innerHTML = cateHtml;
      mobileList.innerHTML = cateHtml;
    } catch (e) {
      console.error('加载分类列表失败:', e);
      const errorHtml = '<li class="text-red-500 px-3 py-2">Failed to load categories</li>';
      if (sidebarList) sidebarList.innerHTML = errorHtml;
      if (mobileList) mobileList.innerHTML = errorHtml;
    }
  }
};

// ===================== 第三步：分类页核心业务函数 =====================
/**
 * 加载分类基础信息（标题、面包屑、页面标题）
 * @param {number} catid - 分类ID
 */
async function loadCategoryInfo(catid) {
  try {
    // 获取所有分类，匹配当前分类
    const res = await axios.get(`${AppConfig.API_BASE_URL}/cate/all`);
    const categories = res.data.data || [];
    const currentCate = categories.find(cate => AppUtils.toNumber(cate.catid || cate.id, 0) === catid) || {};

    // 分类名称兜底
    const cateName = currentCate.name || 'Unknown Category';

    // 更新页面标题（SEO友好）
    document.title = `${cateName} - ShopEasy`;

    // 渲染面包屑（容错：元素不存在则跳过）
    if (document.getElementById('breadcrumb-cate-name')) {
      document.getElementById('breadcrumb-cate-name').textContent = cateName;
    }

    // 渲染分类标题
    if (document.getElementById('cate-name')) {
      document.getElementById('cate-name').textContent = cateName;
    }

    // 渲染分类描述
    if (document.getElementById('cate-desc')) {
      document.getElementById('cate-desc').textContent = currentCate.description || `Explore all products in ${cateName} category`;
    }

    // 加载分类列表（高亮当前分类）
    await AppCommon.loadAllCategories(catid);
  } catch (error) {
    throw new Error(`加载分类信息失败: ${error.message}`);
  }
}

/**
 * 加载分类下的商品列表（核心：兼容全局加购函数）
 * @param {number} catid - 分类ID
 */
async function loadCategoryProducts(catid) {
  try {
    showLoading(); // 显示Loading
    // 调用后端API获取分类商品
    const res = await axios.get(`${AppConfig.API_BASE_URL}/products/list?catid=${catid}`);
    const products = res.data.data || [];
    const productListEl = document.getElementById('product-list');

    // 容错：商品列表容器不存在
    if (!productListEl) {
      console.warn('商品列表容器 #product-list 未找到');
      hideLoading();
      return;
    }

    // 无商品提示
    if (products.length === 0) {
      productListEl.innerHTML = `
        <div class="col-span-full text-center text-gray-500 py-8">
          <i class="fa-solid fa-box-open text-4xl mb-3"></i>
          <p>No products found in this category</p>
        </div>
      `;
      hideLoading();
      return;
    }

    // 渲染商品列表（兼容全局addToCart函数）
    let productHtml = '';
    products.forEach(pro => {
      // 强制校验商品ID有效性
      const validPid = AppUtils.toNumber(pro.pid || pro.id, 0);
      if (validPid === 0) return; // 无效ID跳过

      // 商品信息兜底
      const imgSrc = pro.img_path || AppConfig.DEFAULT_IMG;
      const proName = pro.name || 'Unnamed Product';
      const proDesc = pro.description || 'No product description available';
      const proPrice = AppUtils.formatPrice(pro.price);

      // 商品卡片HTML（核心：加购按钮拦截a标签跳转，调用全局addToCart）
      productHtml += `
        <div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
          <!-- 商品图片 -->
          <a href="${AppConfig.PAGE_PATHS.PRODUCT_DETAIL}?pid=${validPid}" class="block">
            <img src="${imgSrc}" alt="${proName}" class="w-full h-48 object-contain p-4 bg-gray-50">
          </a>
          <!-- 商品信息 -->
          <div class="p-4 flex-1">
            <a href="${AppConfig.PAGE_PATHS.PRODUCT_DETAIL}?pid=${validPid}" class="block">
              <h3 class="text-lg font-medium text-gray-800 mb-2 line-clamp-1 hover:text-blue-600">${proName}</h3>
              <p class="text-gray-600 text-sm mb-4 line-clamp-2">${proDesc}</p>
              <p class="text-blue-600 font-bold text-xl mb-4">${proPrice}</p>
            </a>
          </div>
          <!-- 加购按钮（核心：调用全局addToCart，拦截默认事件） -->
          <button 
            class="mt-auto bg-blue-600 text-white py-2 px-4 rounded-b-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            onclick="addToCart(${validPid}, event); event.preventDefault(); event.stopPropagation();"
            data-pid="${validPid}">
            <i class="fa-solid fa-cart-shopping mr-2"></i> Add to Cart
          </button>
        </div>
      `;
    });

    // 渲染到页面
    productListEl.innerHTML = productHtml;
    hideLoading(); // 隐藏Loading
  } catch (error) {
    console.error(`加载分类商品失败: ${error.message}`);
    hideLoading(); // 失败也隐藏Loading
    // 渲染错误提示
    if (document.getElementById('product-list')) {
      document.getElementById('product-list').innerHTML = `
        <div class="col-span-full text-center text-red-500 py-8">
          <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
          <p>Failed to load products. Please try again later.</p>
        </div>
      `;
    }
  }
}

/**
 * 渲染全局错误页面（兜底）
 */
function renderErrorPage() {
  // 重置分类标题
  if (document.getElementById('cate-name')) {
    document.getElementById('cate-name').textContent = 'Unknown Category';
  }
  // 重置面包屑
  if (document.getElementById('breadcrumb-cate-name')) {
    document.getElementById('breadcrumb-cate-name').textContent = 'Unknown';
  }
  // 重置商品列表
  if (document.getElementById('product-list')) {
    document.getElementById('product-list').innerHTML = `
      <div class="col-span-full text-center text-red-500 py-8">
        <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
        <p>Failed to load category data</p>
      </div>
    `;
  }
}

// ===================== 第四步：页面初始化入口（核心） =====================
document.addEventListener('DOMContentLoaded', async () => {
  // 1. 解析并验证分类ID（URL参数）
  let catid = AppUtils.getUrlParam('catid');
  catid = AppUtils.toNumber(catid, 1); // 兜底为1

  try {
    // 2. 初始化通用交互（移动端抽屉）
    AppCommon.initMobileDrawer();
    
    // 3. 加载分类基础信息（标题/面包屑/分类列表）
    await loadCategoryInfo(catid);
    
    // 4. 加载分类下的商品列表
    await loadCategoryProducts(catid);
  } catch (error) {
    console.error('分类页初始化失败:', error);
    renderErrorPage(); // 渲染错误页面
    hideLoading(); // 确保Loading隐藏
  }
});