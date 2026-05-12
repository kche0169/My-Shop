/**
 * 全局通用交互 - 移动端抽屉、全局事件等
 */

// 全局加载状态函数
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

window.hideLoading = function() {
  const loadingEl = document.getElementById('global-loading');
  if (loadingEl) loadingEl.style.display = 'none';
};

window.AppCommon = {
  /**
   * 初始化移动端抽屉
   */
  initMobileDrawer() {
    const btnOpen = document.getElementById('mobile-category-btn');
    const btnClose = document.getElementById('mobile-category-close');
    const drawer = document.getElementById('mobile-category-drawer');

    if (!btnOpen || !btnClose || !drawer) return;

    // 打开/关闭抽屉
    btnOpen.onclick = () => drawer.classList.remove('-translate-x-full');
    btnClose.onclick = () => drawer.classList.add('-translate-x-full');

    // 点击外部关闭抽屉
    document.addEventListener('click', (e) => {
      if (!drawer.contains(e.target) && !btnOpen.contains(e.target)) {
        drawer.classList.add('-translate-x-full');
      }
    });
  },

  /**
   * 初始化Swiper轮播（通用方法）
   * @param {string} selector - Swiper容器选择器
   * @param {Object} customConfig - 自定义配置（覆盖默认）
   */
  initSwiper(selector = '.mySwiper', customConfig = {}) {
    if (!window.Swiper) {
      console.warn('Swiper库未引入，轮播初始化失败');
      return;
    }
    const config = { ...AppConfig.SWIPER_CONFIG, ...customConfig };
    return new Swiper(selector, config);
  },

  /**
   * 加载所有分类（侧边栏+移动端）
   * @param {number} activeCatId - 当前激活的分类ID（可选）
   */
  async loadAllCategories(activeCatId = null) {
    try {
      const res = await axios.get(`${AppConfig.API_BASE_URL}/cate/all`);
      const categories = res.data.data || [];

      if (categories.length === 0) {
        this.renderEmptyCategory();
        return;
      }

      this.renderCategoryList(categories, activeCatId);
    } catch (error) {
      console.error('加载分类失败:', error);
      this.renderErrorCategory();
    }
  },

  /**
   * 渲染分类列表（侧边栏+移动端）
   * @param {Array} categories - 分类列表
   * @param {number} activeCatId - 当前激活的分类ID
   */
renderCategoryList(categories, activeCatId) {
  const sidebarList = document.getElementById('sidebar-cate-list');
  const mobileList = document.getElementById('mobile-cate-list');
  if (!sidebarList || !mobileList) return;

  sidebarList.innerHTML = '';
  mobileList.innerHTML = '';

  categories.forEach(cate => {
    const isActive = cate.catid === activeCatId;
    // 使用 SEO URL 格式: /{catId}-{categoryName}
    const seoUrl = `/${cate.catid}-${AppUtils.slugify(cate.name)}`;
    const liHtml = `
      <a href="${seoUrl}" 
         class="block px-3 py-2 rounded-md ${isActive ? 'text-blue-700 bg-blue-50 font-medium' : 'text-gray-600'} hover:bg-blue-100 hover:text-blue-600 transition-colors">
          ${cate.name}
      </a>
    `;

    // 侧边栏分类
    const sidebarLi = document.createElement('li');
    sidebarLi.innerHTML = liHtml;
    sidebarList.appendChild(sidebarLi);

    // 移动端抽屉分类
    const mobileLi = document.createElement('li');
    mobileLi.innerHTML = liHtml;
    mobileList.appendChild(mobileLi);
  });
},

  /**
   * 渲染空分类提示
   */
  renderEmptyCategory() {
    const emptyHtml = '<li class="text-gray-500">No categories</li>';
    document.getElementById('sidebar-cate-list').innerHTML = emptyHtml;
    document.getElementById('mobile-cate-list').innerHTML = emptyHtml;
  },

  /**
   * 渲染分类加载失败提示
   */
  renderErrorCategory() {
    const errorHtml = '<li class="text-red-500">Load failed</li>';
    document.getElementById('sidebar-cate-list').innerHTML = errorHtml;
    document.getElementById('mobile-cate-list').innerHTML = errorHtml;
  }
};