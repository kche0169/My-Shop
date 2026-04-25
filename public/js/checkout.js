/**
 * public/js/checkout.js
 * 修复版：确保 Checkout.init 一定存在
 */
(function() {
  // 确保全局对象存在
  window.Checkout = window.Checkout || {};

  // 初始化函数
  window.Checkout.init = function() {
    const btn = document.getElementById('checkout-btn');
    if (!btn) {
      console.log('❌ 未找到 checkout-btn 按钮');
      return;
    }

    console.log('✅ Checkout 初始化成功，绑定按钮');

    btn.onclick = async function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('✅ 结账按钮被点击了！');
      await processCheckout();
    };
  };

  // 核心结账逻辑
// 核心结账逻辑
  async function processCheckout() {
    try {
      // 1. 检查购物车
      if (!window.cart) {
        alert('购物车未初始化');
        return;
      }

      const cartItems = window.cart.getCartItems();
      if (!cartItems || cartItems.length === 0) {
        alert('购物车是空的！');
        return;
      }

      console.log('📦 当前购物车商品：', cartItems);

      // 2. 只传 pid 和 num（作业要求）
      const itemsToSend = cartItems.map(item => ({
        pid: item.pid,
        num: item.num
      }));

      // ===================== 【获取当前登录真实用户ID】 =====================
      const userRes = await fetch('/api/userinfo', { 
        credentials: 'include',
        cache: 'no-store'
      });
      const userInfo = await userRes.json();
      if (!userInfo.isLogin) {
        alert('请先登录！');
        window.location.href = '/login.html';
        return;
      }
      const userId = userInfo.userId; // 真实用户ID（1=管理员，2=普通用户）
      // ================================================================================

      // 3. 调用后端创建订单
      console.log('🚀 发送请求到后端...');
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userid: userId, // 现在用真实ID，不再固定为1
          items: itemsToSend
        })
      });

      const data = await res.json();
      console.log('📨 后端返回：', data);

      if (data.code !== 0) {
        alert('创建订单失败：' + data.msg);
        return;
      }

      // 4. 清空购物车 + 跳转 PayPal
      alert('订单创建成功！即将跳转到 PayPal 付款...');
      window.cart.clearCart();
      
      if (data.data && data.data.approvalLink) {
        window.location.href = data.data.approvalLink;
      }

    } catch (err) {
      console.error('❌ 结账出错：', err);
      alert('结账失败：' + err.message);
    }
  }

  // 自动初始化（页面加载完自动跑，不用你在 HTML 里写代码）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.Checkout.init);
  } else {
    window.Checkout.init();
  }
})();