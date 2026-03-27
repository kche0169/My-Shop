// login.js
// Define role display and behavior configurations
const roleConfig = {
    Guest: { text: 'Guest', bgColor: 'bg-gray-100', textColor: 'text-gray-600', link: '/login.html' },
    User: { text: 'User', bgColor: 'bg-blue-100', textColor: 'text-blue-700', link: '/login.html' },
    Admin: { text: 'Admin', bgColor: 'bg-red-100', textColor: 'text-red-700', link: '/login.html' }
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
    window.location.href = 'login.html';
}

// login.js【修复：确保角色存完再跳转】
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorAlert = document.getElementById('error-alert');
    
    // Hide previous errors
    errorAlert.style.display = 'none';

    // ==========================================
    // [NEW] Frontend validation: Email format + Password length
    // ==========================================
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
    // ==========================================

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        
        // Debug log to see what backend returns
        console.log('Login response:', data);

        // Check business logic success (not just HTTP status)
        if (data.success) {
            // 【关键修复】先把后端返回的角色存到localStorage
            const targetRole = data.role || 'User';
            localStorage.setItem('userRole', targetRole);
            console.log('角色已存储:', targetRole);
            
            // 【关键修复】等100ms确保localStorage写入完成，再跳转
            setTimeout(() => {
                console.log('Redirecting to:', data.redirectUrl);
                window.location.href = data.redirectUrl || '/';
            }, 100);
        } else {
            // Show business logic error
            errorAlert.textContent = data.message || data.msg || 'Invalid email or password';
            errorAlert.style.display = 'block';
        }
    } catch (err) {
        errorAlert.textContent = 'Network error, please try again later';
        errorAlert.style.display = 'block';
        console.error('Login error:', err);
    }
})


// 整个 user icon 区域点击跳转逻辑
wrapper.addEventListener('click', async () => {
  let currentRole = localStorage.getItem('userRole') || 'Guest';
  console.log('click, role=', currentRole);

  if (currentRole === 'Guest') window.location.href = '/login';
  else if (currentRole === 'Admin') window.location.href = '/admin';
  else window.location.href = '/';
});