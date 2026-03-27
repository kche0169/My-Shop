// register.js
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorAlert = document.getElementById('error-alert');
    
    // 隐藏之前的错误
    errorAlert.style.display = 'none';

    // 1. 前端先校验两次密码是否一致
    if (password !== confirmPassword) {
        errorAlert.textContent = '两次输入的密码不一致';
        errorAlert.style.display = 'block';
        return;
    }

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // 注册成功，跳转到登录页
            window.location.href = '/login';
        } else {
            // 显示错误（比如邮箱已被注册）
            errorAlert.textContent = data.message || '注册失败，请稍后重试';
            errorAlert.style.display = 'block';
        }
    } catch (err) {
        errorAlert.textContent = '网络错误，请稍后重试';
        errorAlert.style.display = 'block';
        console.error(err);
    }
});