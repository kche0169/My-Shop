document.addEventListener('DOMContentLoaded', async () => {
  const roleTag = document.getElementById('roleTag');
  const tooltipRole = document.getElementById('tooltipRole');
  const userMenuItems = document.getElementById('userMenuItems');

  const res = await fetch('/api/userinfo', { cache: 'no-store', credentials: 'include' });
  const user = await res.json();

  roleTag.textContent = user.role;
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
    // ==============================================
    // 核心修改：根据角色自动切换菜单（保留你所有原有代码）
    // ==============================================
    let roleMenu = '';
    if (user.role === 'admin') {
      // 管理员：显示管理面板
      roleMenu = `
      <a href="/admin" class="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
        <i class="fa-solid fa-user-shield w-4 text-center"></i>
        <span class="text-sm">Admin Panel</span>
      </a>
      `;
    } else {
      // 普通用户：显示用户面板 + 我的订单
      roleMenu = `
      <a href="/user.html" class="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
        <i class="fa-solid fa-user w-4 text-center"></i>
        <span class="text-sm">User Panel</span>
      </a>
      <a href="/user.html#orders-content" class="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
        <i class="fa-solid fa-box w-4 text-center"></i>
        <span class="text-sm">My Orders</span>
      </a>
      `;
    }

    // 渲染最终菜单（保留你原来的 改密码/重登/登出）
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

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      try {
        await axios.get('/api/logout');
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        localStorage.removeItem('userRole');
        window.location.replace('/');
      }
    });
  }
});

function showChangePasswordModal() {
  const oldPwd = prompt("Enter current password:");
  if (!oldPwd) return;

  const newPwd = prompt("Enter new password (min 6 characters):");
  if (!newPwd) return;

  if (newPwd.length < 6) {
    alert("Password must be at least 6 characters long!");
    return;
  }

  const confirmPwd = prompt("Confirm new password:");
  if (confirmPwd !== newPwd) {
    alert("Passwords do not match!");
    return;
  }

  axios.post('/api/change-password', {
    currentPassword: oldPwd,
    newPassword: newPwd
  }).then(res => {
    if (res.data.success) {
      alert("Password changed successfully! Please login again.");
      localStorage.removeItem('userRole');
      window.location.replace('/login.html');
    } else {
      alert("Failed: " + res.data.message);
    }
  }).catch(err => {
    alert("Current password incorrect or server error");
  });
}

function showChangePasswordModal() {
  const oldPwd = prompt("Enter current password:");
  if (!oldPwd) return;

  const newPwd = prompt("Enter new password (min 6 characters):");
  if (!newPwd) return;

  if (newPwd.length < 6) {
    alert("Password must be at least 6 characters long!");
    return;
  }

  const confirmPwd = prompt("Confirm new password:");
  if (confirmPwd !== newPwd) {
    alert("Passwords do not match!");
    return;
  }

  axios.post('/api/change-password', {
    currentPassword: oldPwd,
    newPassword: newPwd
  }).then(res => {
    if (res.data.success) {
      alert("Password changed successfully! Please login again.");
      localStorage.removeItem('userRole');
      window.location.replace('/login.html');
    } else {
      alert("Failed: " + res.data.message);
    }
  }).catch(err => {
    alert("Current password incorrect or server error");
  });
}

  document.addEventListener('DOMContentLoaded', function() {
    // 获取所有按钮和内容区域
    const buttons = document.querySelectorAll('.user-sidebar .btn[data-target]');
    const contentAreas = document.querySelectorAll('.content-area');

    buttons.forEach(button => {
      button.addEventListener('click', function() {
        // 1. 移除所有按钮的 active 状态
        buttons.forEach(btn => btn.classList.remove('active'));
        
        // 2. 给当前点击的按钮添加 active 状态
        this.classList.add('active');
        
        // 3. 获取要显示的内容区域 ID
        const targetId = this.getAttribute('data-target');
        
        // 4. 隐藏所有内容区域
        contentAreas.forEach(area => area.classList.remove('active'));
        
        // 5. 显示目标内容区域
        const targetArea = document.getElementById(targetId);
        if (targetArea) {
          targetArea.classList.add('active');
        }
      });
    });
  });

async function loadUserRealOrders() {
  const listEl = document.getElementById('realOrdersList');
  try {
    // 🔥 修复：必须加上 credentials: 'include' 携带登录Cookie！
    const res = await fetch('/api/orders/user/recent', {
      credentials: 'include'  // 👈 这是唯一要加的东西
    });
    const result = await res.json();

    if (result.code !== 0 || !result.data || result.data.length === 0) {
      listEl.innerHTML = `<p class="text-gray-500">You have no orders yet.</p>`;
      return;
    }

    let html = '';
    result.data.forEach(order => {
      let items = [];
      try {
        items = JSON.parse(order.items_json);
      } catch (e) {}

      const itemText = items.map(i => `Product #${i.pid} × ${i.num}`).join(', ');

      html += `
      <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
        <div class="flex justify-between items-start mb-2">
          <div>
            <span class="text-sm text-gray-500">Order #${order.id}</span>
            <p class="font-medium">Total: ${order.currency} ${order.total_price}</p>
          </div>
          <span class="px-2 py-1 rounded text-xs font-medium ${
            order.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }">
            ${order.status}
          </span>
        </div>
        <div class="text-sm text-gray-600">
          <p>${itemText || 'No items'}</p>
        </div>
      </div>
      `;
    });

    listEl.innerHTML = html;
  } catch (err) {
    listEl.innerHTML = `<p class="text-red-500">Failed to load orders</p>`;
  }
}
// 当页面切换到订单标签时自动加载
document.querySelector('[data-target="orders-content"]').addEventListener('click', () => {
  setTimeout(loadUserRealOrders, 100);
});

loadUserRealOrders();