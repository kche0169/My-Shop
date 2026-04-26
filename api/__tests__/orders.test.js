const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

describe('Orders API Tests', () => {
  
  describe('POST /api/orders/create', () => {
    
    test('should create order successfully with valid items', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: [{ pid: 1, num: 2 }]
        });
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('orderId');
      expect(res.body.data).toHaveProperty('paypalOrderId');
      expect(res.body.data).toHaveProperty('approvalLink');
    });

    test('should fail with invalid userid (userid < 1)', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 0,
          items: [{ pid: 1, num: 2 }]
        });
      
      expect(res.status).toBe(400);
    });

    test('should fail with empty items array', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: []
        });
      
      expect(res.status).toBe(400);
    });

    test('should fail with missing userid', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          items: [{ pid: 1, num: 2 }]
        });
      
      expect(res.status).toBe(400);
    });

    test('should fail with invalid product id (pid < 1)', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: [{ pid: -1, num: 2 }]
        });
      
      expect(res.status).toBe(400);
    });

    test('should fail with invalid quantity (num < 1)', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: [{ pid: 1, num: 0 }]
        });
      
      expect(res.status).toBe(400);
    });

    test('should skip invalid products and create order with valid ones', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: [
            { pid: 9999, num: 1 },
            { pid: 1, num: 2 }
          ]
        });
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });

    test('should fail when all items are invalid', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: [
            { pid: 9999, num: 1 },
            { pid: 8888, num: 2 }
          ]
        });
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });
  });

  describe('GET /api/orders/user/recent', () => {
    
    test('should return 401 when not logged in', async () => {
      const res = await request(app)
        .get('/api/orders/user/recent');
      
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(-1);
      expect(res.body.msg).toBe('Please login first');
    });

    test('should return recent orders when logged in', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .get('/api/orders/user/recent')
        .set('Cookie', cookie);
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('should return at most 5 recent orders', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .get('/api/orders/user/recent')
        .set('Cookie', cookie);
      
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    test('should return 401 with invalid session', async () => {
      const res = await request(app)
        .get('/api/orders/user/recent')
        .set('Cookie', 'user=invalid_session_token');
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/orders/paypal/success', () => {
    
    test('should redirect to index.html', async () => {
      const res = await request(app)
        .get('/api/orders/paypal/success');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/index.html');
    });

    test('should update order status when token provided', async () => {
      const createRes = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: [{ pid: 1, num: 1 }]
        });
      
      const paypalOrderId = createRes.body.data.paypalOrderId;
      
      const successRes = await request(app)
        .get(`/api/orders/paypal/success?token=${paypalOrderId}`);
      
      expect(successRes.status).toBe(302);
    });
  });
});
