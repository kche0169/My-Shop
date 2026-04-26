/**
 * User Menu & Navbar Logic
 * 处理导航栏用户菜单、登出、修改密码等全局用户交互
 */
import { authApi } from '../api/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
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

window.showChangePasswordModal = async function() {
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