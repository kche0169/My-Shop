/**
 * 完整结账流程测试（最终版 - 每个测试独立）
 * 覆盖场景：
 * A. 创建订单
 * B. 管理员跟踪订单
 * C. 订单支付验证
 * D. 用户查看历史订单，管理员查看所有订单
 */

const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

describe('Complete Checkout Flow Tests', () => {
  
  // ========== A. 创建订单 ==========
  describe('A. Order Creation', () => {
    
    test('A1: User login and create order', async () => {
      // 登录
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      expect(loginRes.status).toBe(200);
      
      // 创建订单
      const createRes = await request(app)
        .post('/api/orders/create')
        .send({ userid: 2, items: [{ pid: 1, num: 2 }] });
      
      expect(createRes.status).toBe(200);
      expect(createRes.body.code).toBe(0);
      expect(createRes.body.data).toHaveProperty('orderId');
      
      const orderId = createRes.body.data.orderId;
      
      // 通过管理员接口验证订单
      const adminLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const adminCookie = adminLoginRes.headers['set-cookie'][0];
      
      const allOrdersRes = await request(app)
        .get('/api/orders/admin/all')
        .set('Cookie', adminCookie);
      
      const orders = allOrdersRes.body.data;
      const order = orders.find(o => o.id === orderId);
      
      expect(order).toBeDefined();
      expect(order.status).toBe('PENDING');
      expect(order.total_price).toBeGreaterThan(0);
    });
  });

  // ========== B. 管理员跟踪订单 ==========
  describe('B. Admin Order Tracking', () => {
    
    test('B1: Admin can view all orders', async () => {
      // 先创建订单
      await request(app)
        .post('/api/orders/create')
        .send({ userid: 2, items: [{ pid: 1, num: 1 }] });
      
      // 管理员登录
      const adminLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const adminCookie = adminLoginRes.headers['set-cookie'][0];
      
      // 获取所有订单
      const res = await request(app)
        .get('/api/orders/admin/all')
        .set('Cookie', adminCookie);
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('B2: Non-admin cannot view all orders', async () => {
      // 普通用户登录
      const userLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const userCookie = userLoginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .get('/api/orders/admin/all')
        .set('Cookie', userCookie);
      
      expect(res.status).toBe(403);
    });
  });

  // ========== C. 订单支付验证 ==========
  describe('C. Order Payment Verification', () => {
    
    test('C1: Admin can verify order', async () => {
      // 创建订单
      const createRes = await request(app)
        .post('/api/orders/create')
        .send({ userid: 2, items: [{ pid: 1, num: 1 }] });
      
      const orderId = createRes.body.data.orderId;
      
      // 管理员登录
      const adminLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const adminCookie = adminLoginRes.headers['set-cookie'][0];
      
      // 验证订单
      const verifyRes = await request(app)
        .post('/api/orders/admin/verify')
        .set('Cookie', adminCookie)
        .send({ orderId });
      
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.code).toBe(0);
      
      // 通过管理员接口检查订单状态
      const allOrdersRes = await request(app)
        .get('/api/orders/admin/all')
        .set('Cookie', adminCookie);
      
      const orders = allOrdersRes.body.data;
      const verifiedOrder = orders.find(o => o.id === orderId);
      
      expect(verifiedOrder).toBeDefined();
      expect(verifiedOrder.status).toBe('PAID');
    });

    test('C2: Non-admin cannot verify order', async () => {
      // 普通用户登录
      const userLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const userCookie = userLoginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .post('/api/orders/admin/verify')
        .set('Cookie', userCookie)
        .send({ orderId: 1 });
      
      expect(res.status).toBe(403);
    });

    test('C3: Verify fails with invalid order ID', async () => {
      const adminLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const adminCookie = adminLoginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .post('/api/orders/admin/verify')
        .set('Cookie', adminCookie)
        .send({ orderId: 99999 });
      
      expect(res.status).toBe(404);
    });
  });

  // ========== D. 查看订单历史 ==========
  describe('D. Order History Viewing', () => {
    
    test('D1: User can view their orders', async () => {
      // 先创建订单
      const createRes = await request(app)
        .post('/api/orders/create')
        .send({ userid: 2, items: [{ pid: 1, num: 1 }] });
      
      const orderId = createRes.body.data.orderId;
      
      // 管理员验证订单
      const adminLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const adminCookie = adminLoginRes.headers['set-cookie'][0];
      
      await request(app)
        .post('/api/orders/admin/verify')
        .set('Cookie', adminCookie)
        .send({ orderId });
      
      // 用户登录后查看
      const userLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const userCookie = userLoginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .get('/api/orders/user/recent')
        .set('Cookie', userCookie);
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      
      const orders = res.body.data;
      expect(orders.length).toBeGreaterThan(0);
      
      const foundOrder = orders.find(o => o.id === orderId);
      expect(foundOrder).toBeDefined();
      expect(foundOrder.status).toBe('PAID');
    });

    test('D2: User order includes items_json', async () => {
      // 创建订单
      const createRes = await request(app)
        .post('/api/orders/create')
        .send({ userid: 2, items: [{ pid: 2, num: 2 }] });
      
      const orderId = createRes.body.data.orderId;
      
      // 用户登录
      const userLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const userCookie = userLoginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .get('/api/orders/user/recent')
        .set('Cookie', userCookie);
      
      expect(res.status).toBe(200);
      const orders = res.body.data;
      expect(orders.length).toBeGreaterThan(0);
      
      const order = orders.find(o => o.id === orderId);
      expect(order).toBeDefined();
      expect(order.items_json).toBeDefined();
      
      const items = JSON.parse(order.items_json);
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(1);
      expect(items[0].pid).toBe(2);
      expect(items[0].num).toBe(2);
    });

    test('D3: Admin can view all orders', async () => {
      // 管理员登录
      const adminLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const adminCookie = adminLoginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .get('/api/orders/admin/all')
        .set('Cookie', adminCookie);
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('D4: Unauthenticated user cannot view orders', async () => {
      const res = await request(app)
        .get('/api/orders/user/recent');
      
      expect(res.status).toBe(401);
      expect(res.body.msg).toBe('Please login first');
    });
  });

  // ========== E. 完整流程集成测试 ==========
  describe('E. End-to-End Integration', () => {
    
    test('E2E: Complete flow from order to verification', async () => {
      // 1. 用户登录
      const userLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const userCookie = userLoginRes.headers['set-cookie'][0];
      
      // 2. 创建订单
      const createRes = await request(app)
        .post('/api/orders/create')
        .send({ userid: 2, items: [{ pid: 3, num: 1 }] });
      
      expect(createRes.status).toBe(200);
      const orderId = createRes.body.data.orderId;
      
      // 3. 管理员登录并验证
      const adminLoginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const adminCookie = adminLoginRes.headers['set-cookie'][0];
      
      const verifyRes = await request(app)
        .post('/api/orders/admin/verify')
        .set('Cookie', adminCookie)
        .send({ orderId });
      
      expect(verifyRes.status).toBe(200);
      
      // 4. 用户查看已验证订单
      const userOrdersRes = await request(app)
        .get('/api/orders/user/recent')
        .set('Cookie', userCookie);
      
      expect(userOrdersRes.status).toBe(200);
      const orders = userOrdersRes.body.data;
      const verifiedOrder = orders.find(o => o.id === orderId);
      
      expect(verifiedOrder).toBeDefined();
      expect(verifiedOrder.status).toBe('PAID');
    });
  });
});
