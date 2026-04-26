const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

describe('Comprehensive Auth Tests', () => {
  // 测试用户信息
  describe('GET /api/userinfo', () => {
    test('should return guest status when not logged in', async () => {
      const res = await request(app).get('/api/userinfo');
      
      expect(res.status).toBe(200);
      expect(res.body.isLogin).toBe(false);
      expect(res.body.role).toBe('Guest');
    });
  });

  // 测试登录功能 - 使用现有的测试用户
  describe('POST /api/login', () => {
    test('should login successfully with user credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.role).toBe('User');
      expect(res.body.redirectUrl).toBe('/');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    test('should login successfully with admin credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.role).toBe('Admin');
      expect(res.body.redirectUrl).toBe('/admin');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    test('should fail login with invalid password', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'wrongpassword' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Password error');
    });

    test('should fail login with non-existent user', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });
  });

  // 测试登录状态下的用户信息
  describe('GET /api/userinfo when logged in', () => {
    test('should return user status when logged in as user', async () => {
      // 登录
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      // 提取cookie
      const cookie = loginRes.headers['set-cookie'][0];
      
      // 使用cookie获取用户信息
      const userInfoRes = await request(app)
        .get('/api/userinfo')
        .set('Cookie', cookie);
      
      expect(userInfoRes.status).toBe(200);
      expect(userInfoRes.body.isLogin).toBe(true);
      expect(userInfoRes.body.role).toBe('User');
      expect(userInfoRes.body.email).toBe('user@shop.com');
    });

    test('should return admin status when logged in as admin', async () => {
      // 登录
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      // 提取cookie
      const cookie = loginRes.headers['set-cookie'][0];
      
      // 使用cookie获取用户信息
      const userInfoRes = await request(app)
        .get('/api/userinfo')
        .set('Cookie', cookie);
      
      expect(userInfoRes.status).toBe(200);
      expect(userInfoRes.body.isLogin).toBe(true);
      expect(userInfoRes.body.role).toBe('Admin');
      expect(userInfoRes.body.email).toBe('admin@shop.com');
    });
  });

  // 测试登出功能
  describe('GET /api/logout', () => {
    test('should logout successfully', async () => {
      // 登录
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      // 登出
      const logoutRes = await request(app)
        .get('/api/logout')
        .set('Cookie', cookie);
      
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.text).toBe('Logout success');
      expect(logoutRes.headers['set-cookie']).toBeDefined();
    });
  });

  // 测试密码修改
  describe('POST /api/change-password', () => {
    test('should change password successfully', async () => {
      // 登录
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      // 修改密码
      const changePassRes = await request(app)
        .post('/api/change-password')
        .set('Cookie', cookie)
        .send({ currentPassword: 'User123!', newPassword: 'NewPassword123!' });
      
      expect(changePassRes.status).toBe(200);
      expect(changePassRes.body.success).toBe(true);
      
      // 用新密码登录
      const newLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'NewPassword123!' });
      
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.success).toBe(true);
      
      // 改回原密码
      const revertLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'NewPassword123!' });
      
      const revertCookie = revertLoginRes.headers['set-cookie'][0];
      
      await request(app)
        .post('/api/change-password')
        .set('Cookie', revertCookie)
        .send({ currentPassword: 'NewPassword123!', newPassword: 'User123!' });
    });
  });
});
