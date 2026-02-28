/**
 * 通用工具函数 - 格式化、容错、路径处理等
 */
window.AppUtils = {
  /**
   * 格式化价格（保留2位小数）
   * @param {number|string} price - 原始价格
   * @returns {string} 格式化后的价格（$xx.xx）
   */
  formatPrice(price) {
    const num = parseFloat(price) || 0;
    return `$${num.toFixed(2)}`;
  },

/**
 * 解析URL参数（强化版：确保返回值可控）
 * @param {string} key - 参数名
 * @returns {string|null} 参数值
 */
getUrlParam(key) {
  if (!key) return null;
  // 兼容各种URL格式
  const search = window.location.search || '';
  const urlParams = new URLSearchParams(search);
  const value = urlParams.get(key);
  // 过滤空值/空白值
  return (value && value.trim() !== '') ? value.trim() : null;
},
  /**
   * 容错处理：确保值为数字，否则返回默认值
   * @param {any} value - 待校验值
   * @param {number} defaultValue - 默认值
   * @returns {number} 数字值
   */
  toNumber(value, defaultValue = 1) {
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : num;
  },

  /**
   * 构建商品图片轮播列表（主图+副图）
   * @param {string} mainImgPath - 主图路径
   * @returns {string[]} 轮播图路径列表
   */
  buildSliderImgs(mainImgPath) {
    const imgPath = mainImgPath || AppConfig.DEFAULT_IMG;
    const imgBase = imgPath.replace(/\.\w+$/, ''); // 去掉后缀（xxx.jpg → xxx）
    const imgExt = imgPath.split('.').pop() || 'jpg'; // 获取后缀
    return [imgPath, `${imgBase}2.${imgExt}`, `${imgBase}3.${imgExt}`];
  },

  /**
   * 防抖函数（避免高频触发）
   * @param {Function} fn - 执行函数
   * @param {number} delay - 延迟时间
   * @returns {Function} 防抖后的函数
   */
  debounce(fn, delay = 300) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
};