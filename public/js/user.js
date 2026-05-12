/**
 * User Menu & Navbar Logic
 * 处理导航栏用户菜单、登出、修改密码等全局用户交互
 */
(function(global) {
  'use strict';

  const authApi = global.API.auth;

  document.addEventListener('DOMContentLoaded', async () => {
    initSidebarNavigation();
    await loadOrders();

    const roleTag = document.getElementById('roleTag');
    const tooltipRole = document.getElementById('tooltipRole');
    const userMenuItems = document.getElementById('userMenuItems');

    if (!roleTag || !userMenuItems) return;

    try {
      const user = await authApi.getUserInfo();

      roleTag.textContent = user.role || 'Guest';
      tooltipRole.textContent = user.isLogin ? user.role : 'Guest';

      if (user.isLogin) {
        roleTag.classList.add('bg-blue-100', 'text-blue-600');
      } else {
        roleTag.classList.add('bg-gray-100');
      }

      if (!user.isLogin) {
        userMenuItems.innerHTML = `
          <a href="/login.html" class="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <i class="fa-solid fa-right-to-bracket w-4 text-center"></i>
            <span class="text-sm">Login</span>
          </a>
        `;
      } else {
        renderUserMenu(user);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
      roleTag.textContent = 'Guest';
      tooltipRole.textContent = 'Guest';
    }
  });

  function renderUserMenu(user) {
    const userMenuItems = document.getElementById('userMenuItems');
    if (!userMenuItems) return;

    const isAdmin = user.role === 'Admin';
    const roleMenu = isAdmin
      ? `
      <a href="/admin" class="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
        <i class="fa-solid fa-user-shield w-4 text-center"></i>
        <span class="text-sm">Admin Panel</span>
      </a>
      `
      : `
      <a href="/user.html" class="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
        <i class="fa-solid fa-user w-4 text-center"></i>
        <span class="text-sm">User Panel</span>
      </a>
      <a href="/user.html#orders-content" class="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
        <i class="fa-solid fa-box w-4 text-center"></i>
        <span class="text-sm">My Orders</span>
      </a>
      `;

    userMenuItems.innerHTML = `
      ${roleMenu}
      <a href="javascript:showChangePasswordModal()" class="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
        <i class="fa-solid fa-lock w-4 text-center"></i>
        <span class="text-sm">Change Password</span>
      </a>
      <a href="/login.html" class="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
        <i class="fa-solid fa-arrow-rotate-right w-4 text-center"></i>
        <span class="text-sm">Re-login</span>
      </a>
      <div class="my-1 border-t border-gray-100"></div>
      <button id="logoutBtn" class="flex items-center gap-2 px-3 py-2 rounded-md text-red-600 hover:bg-red-50 w-full text-left">
        <i class="fa-solid fa-right-from-bracket w-4 text-center"></i>
        <span class="text-sm">Log Out</span>
      </button>
    `;

    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
  }

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('userRole');
      window.location.replace('/');
    }
  }

  global.showChangePasswordModal = async function() {
    const oldPwd = prompt('Enter current password:');
    if (!oldPwd) return;

    const newPwd = prompt('Enter new password (min 6 characters):');
    if (!newPwd) return;

    if (newPwd.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    const confirmPwd = prompt('Confirm new password:');
    if (confirmPwd !== newPwd) {
      alert('Passwords do not match!');
      return;
    }

    try {
      const result = await authApi.changePassword(oldPwd, newPwd);
      if (result.success) {
        alert('Password changed successfully! Please login again.');
        localStorage.removeItem('userRole');
        window.location.replace('/login.html');
      } else {
        alert('Failed: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Current password incorrect or server error');
    }
  };

  // 侧边栏导航切换功能
  function initSidebarNavigation() {
    const sidebarButtons = document.querySelectorAll('.user-sidebar .btn');
    const contentAreas = document.querySelectorAll('.content-area');

    sidebarButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.dataset.target;
        
        // 更新按钮激活状态
        sidebarButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // 切换内容区域显示
        contentAreas.forEach(area => {
          area.classList.remove('active');
          if (area.id === targetId) {
            area.classList.add('active');
          }
        });

        // 如果点击的是订单按钮，加载订单数据
        if (targetId === 'orders-content') {
          loadOrders();
        }
      });
    });

    // 处理 URL hash 导航
    const hash = window.location.hash.slice(1);
    if (hash) {
      const targetButton = document.querySelector(`.user-sidebar .btn[data-target="${hash}"]`);
      if (targetButton) {
        targetButton.click();
      }
    }
  }

  // 加载用户订单
  async function loadOrders() {
    const ordersContainer = document.getElementById('realOrdersList');
    if (!ordersContainer) return;

    try {
      const result = await global.API.order.getUserRecent();
      
      if (!result || !result.data || result.data.length === 0) {
        ordersContainer.innerHTML = `
          <div class="text-center py-12">
            <i class="fa-solid fa-box-open text-4xl text-gray-300 mb-4"></i>
            <p class="text-gray-500">No orders found</p>
          </div>
        `;
        return;
      }

      const ordersHtml = result.data.map(order => `
        <div class="border rounded-lg p-4">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-bold">Order #${order.oid}</h3>
              <p class="text-sm text-gray-500">${order.created_at || 'Unknown date'}</p>
            </div>
            <span class="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">${order.status || 'Pending'}</span>
          </div>
          <div class="space-y-2 mb-3">
            ${order.items ? order.items.map(item => `
              <div class="flex justify-between text-sm">
                <span>${item.product_name || 'Product'}</span>
                <span>${item.quantity} x $${(item.price || 0).toFixed(2)}</span>
              </div>
            `).join('') : ''}
          </div>
          <div class="flex justify-between font-bold">
            <span>Total:</span>
            <span>$${(order.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>
      `).join('');

      ordersContainer.innerHTML = ordersHtml;
    } catch (error) {
      console.error('Failed to load orders:', error);
      ordersContainer.innerHTML = `
        <div class="text-center py-12">
          <i class="fa-solid fa-exclamation-circle text-4xl text-red-300 mb-4"></i>
          <p class="text-gray-500">Failed to load orders</p>
        </div>
      `;
    }
  }

})(window);