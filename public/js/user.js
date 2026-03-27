document.addEventListener('DOMContentLoaded', async () => {
  const roleTag = document.getElementById('roleTag');
  const tooltipRole = document.getElementById('tooltipRole');
  const userMenuItems = document.getElementById('userMenuItems');

  // 获取登录状态
  const res = await fetch('/api/userinfo', { cache: 'no-store', credentials: 'include' });
  const user = await res.json();

  roleTag.textContent = user.role;
  tooltipRole.textContent = user.isLogin ? user.role : 'Guest';

  if (user.isLogin) {
    roleTag.classList.add('bg-blue-100', 'text-blue-600');
  } else {
    roleTag.classList.add('bg-gray-100');
  }

  // 渲染菜单
  if (!user.isLogin) {
    userMenuItems.innerHTML = `
      <a href="/login.html" class="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
        <i class="fa-solid fa-right-to-bracket w-4 text-center"></i>
        <span class="text-sm">Login</span>
      </a>
    `;
  } else {
    // ================== 已登录菜单（新增修改密码） ==================
    userMenuItems.innerHTML = `
      <a href="/admin" class="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
        <i class="fa-solid fa-user-shield w-4 text-center"></i>
        <span class="text-sm">Admin Panel</span>
      </a>

      <!-- 👉 修改密码 新加入 -->
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

    // 登出逻辑（完全按你的风格）
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

// ==============================================
// 【新增】修改密码弹窗 + 密码长度 >=6 位校验
// ==============================================
function showChangePasswordModal() {
  const oldPwd = prompt("Please enter current password:");
  if (!oldPwd) return;

  const newPwd = prompt("Please enter new password (at least 6 digits):");
  if (!newPwd) return;

  // ✅ 核心：密码长度必须 >=6 位
  if (newPwd.length < 6) {
    alert("Password must be at least 6 characters long!");
    return;
  }

  const confirmPwd = prompt("Please confirm new password:");
  if (confirmPwd !== newPwd) {
    alert("Two passwords do not match!");
    return;
  }

  // 调用后端修改密码接口
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
    alert("Current password error or server error");
  });
}