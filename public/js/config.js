/**
 * 全局通用配置 - 所有页面引入，统一管理常量
 */
window.AppConfig = {
  // 后端API基础地址
  API_BASE_URL: '/api',
  // 默认图片（加载失败时兜底）
  DEFAULT_IMG: '/images/default.png',
  // 轮播配置
  SWIPER_CONFIG: {
    loop: true,
    autoplay: { delay: 3000, disableOnInteraction: false },
    speed: 500
  },
  // localStorage键名
  STORAGE_KEYS: {
    CART: 'shopEasyCart',
    USER: 'shopEasyUser' // 扩展用
  },
  // 页面路径（统一管理，避免硬编码）
  PAGE_PATHS: {
    HOME: '/index.html',
    CATEGORY_DETAIL: '/category/detail.html',
    PRODUCT_DETAIL: '/products/detail.html'
  }
};