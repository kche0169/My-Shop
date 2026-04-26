// login.js
// Define role display and behavior configurations
const roleConfig = {
    Guest: { text: 'Guest', bgColor: 'bg-gray-100', textColor: 'text-gray-600', link: '/login.html' },
    User: { text: 'User', bgColor: 'bg-blue-100', textColor: 'text-blue-700', link: '/' },
    Admin: { text: 'Admin', bgColor: 'bg-red-100', textColor: 'text-red-700', link: '/admin.html' }
};

// 【核心重写】页面加载时，直接调用后端接口获取当前用户角色，100%同步
document.addEventListener('DOMContentLoaded', async function() {
    // Skip if UI elements do not exist (e.g., on login.html)
    const roleTag = document.getElementById('roleTag');
    if (!roleTag) return;

    let currentRole = 'Guest';
    try {
        // 调用后端接口，获取当前登录用户的真实角色
        const res = await fetch('/api/userinfo');
        const data = await res.json();
        currentRole = data.role;
        
        // 同步更新到localStorage，做兜底缓存
        if (currentRole !== 'Guest') {
            localStorage.setItem('userRole', currentRole);
        } else {
            localStorage.removeItem('userRole');
        }
    } catch (err) {
        // 接口调用失败，用localStorage兜底
        console.warn('获取用户信息失败，使用本地缓存:', err);
        currentRole = localStorage.getItem('userRole') || 'Guest';
    }

    // 获取角色配置，兜底为Guest
    const config = roleConfig[currentRole] || roleConfig.Guest;

    // Get other optional UI elements
    const tooltipRole = document.getElementById('tooltipRole');
    const loginLink = document.getElementById('loginLink');

    // Update role tag text and styles
    roleTag.textContent = config.text;
    roleTag.className = `text-sm font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor}`;
    
    // Update tooltip text if element exists
    if (tooltipRole) tooltipRole.textContent = config.text;
    
    // Update login link href if element exists
    if (loginLink) loginLink.href = config.link;
});

// Optional: Logout function to clear stored role and redirect
function logout() {
    localStorage.removeItem('userRole');
    window.location.href = '/login.html';
}

// 登录表单提交逻辑
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorAlert = document.getElementById('error-alert');

        errorAlert.style.display = 'none';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorAlert.textContent = 'Please enter a valid email address';
            errorAlert.style.display = 'block';
            return;
        }
        if (password.length < 6) {
            errorAlert.textContent = 'Password must be at least 6 characters long';
            errorAlert.style.display = 'block';
            return;
        }

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.success) {
                const targetRole = data.role || 'User';
                localStorage.setItem('userRole', targetRole);
                window.location.href = data.redirectUrl || '/';
            } else {
                errorAlert.textContent = data.message || data.msg || 'Invalid email or password';
                errorAlert.style.display = 'block';
            }
        } catch (err) {
            errorAlert.textContent = 'Network error, please try again later';
            errorAlert.style.display = 'block';
        }
    });
});

// ===================== 【修复！！】用户图标点击逻辑 =====================
// 1. 先获取 wrapper 元素（替换为你页面中真实的选择器：类名/ID）
const wrapper = document.querySelector('#userIconWrapper'); 
// 2. 只有元素存在时，才绑定点击事件（避免登录页报错）
if (wrapper) {
    wrapper.addEventListener('click', async () => {
        let currentRole = localStorage.getItem('userRole') || 'Guest';
        console.log('点击用户图标，当前角色:', currentRole);

        // 统一跳转路径，严格匹配角色
        if (currentRole === 'Guest') {
            window.location.href = '/login.html';
        } else if (currentRole === 'Admin') {
            window.location.href = '/admin.html';
        } else {
            // User 角色跳首页
            window.location.href = '/';
        }
    });
}