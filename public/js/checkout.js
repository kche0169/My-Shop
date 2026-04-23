/**
 * public/js/checkout.js
 * 独立的结账逻辑 (不修改 index.js)
 */
window.Checkout = {
  /**
   * 初始化结账按钮
   * @param {string} buttonId - 按钮元素 ID
   * @param {number} userid - 当前用户 ID
   */
  initCheckoutButton: function(buttonId, userid) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await this.processCheckout(userid);
    });
  },

  /**
   * 执行结账流程
   */
  processCheckout: async function(userid) {
    if (!window.cart || window.cart.getTotalItemCount() === 0) {
      alert('Your cart is empty!');
      return;
    }

    try {
      // 1. 只传 pid 和 num 给后端 (作业要求)
      const cartItems = window.cart.getCartItems();
      const itemsToSend = cartItems.map(item => ({
        pid: item.pid,
        num: item.num
      }));

      // 2. 调用后端创建订单接口
      const res = await axios.post('/api/orders/create', {
        userid: userid,
        items: itemsToSend
      });

      if (res.data.code !== 0) {
        throw new Error(res.data.msg);
      }

      const { paypalOrderId, approvalLink } = res.data.data;

      // 3. 清空前端购物车 (作业要求)
      window.cart.clearCart();
      await renderCartPopup(window.cart);
      if (document.getElementById('cart-items')) await renderCartUI(window.cart);

      // 4. 跳转到 PayPal 付款 (作业要求)
      if (approvalLink) {
        window.location.href = approvalLink;
      } else {
        alert('Order created! Please complete payment via PayPal.');
      }

    } catch (err) {
      console.error('[Checkout Error]', err);
      alert('Checkout failed: ' + (err.response?.data?.msg || err.message));
    }
  }
};