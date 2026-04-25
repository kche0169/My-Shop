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