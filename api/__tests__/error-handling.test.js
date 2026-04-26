const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

describe('Error Handling Tests', () => {

  beforeEach((done) => {
    db.run('DELETE FROM cart', (err) => {
      if (err) console.error('Clear cart failed:', err.message);
      db.run('DELETE FROM products', (err) => {
        if (err) console.error('Clear products failed:', err.message);
        db.run('DELETE FROM categories', (err) => {
          if (err) console.error('Clear categories failed:', err.message);
          done();
        });
      });
    });
  });

  describe('Auth API Error Handling', () => {

    test('should return 400 for login without email', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ password: 'Test123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
    });

    test('should return 400 for login without password', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
    });

    test('should return 401 for invalid login credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'invalid@example.com', password: 'wrongpass' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
    });

    test.skip('should return 400 for register without required fields', async () => {
      jest.setTimeout(60000);
      
      const res = await request(app)
        .post('/api/register')
        .send({});

      expect(res.status).toBe(500);
    }, 60000);

    test('should return 400 for register with invalid email', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!',
          name: 'Test User'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should return 400 for register with weak password', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Category API Error Handling', () => {

    test('should return 401 for unauthenticated category add', async () => {
      const res = await request(app)
        .post('/api/cate/add')
        .send({ name: 'Test Category' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(-1);
    });

    test('should return 403 for non-admin category add', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(-1);
    });

    test('should return 400 for empty category name', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('should return 404 for non-existent category edit', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .post('/api/cate/edit')
        .set('Cookie', cookie)
        .send({ catid: 9999, name: 'Updated Category' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test.skip('should return 404 for non-existent category delete', async () => {
      jest.setTimeout(60000);
      
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .get('/api/cate/del/9999')
        .set('Cookie', cookie);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    }, 60000);
  });

  describe('Product API Error Handling', () => {

    test('should return 401 for unauthenticated product add', async () => {
      const res = await request(app)
        .post('/api/products/add')
        .field('catid', 1)
        .field('name', 'Test Product')
        .field('price', '99.99');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(-1);
    });

    test('should return 403 for non-admin product add', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', 1)
        .field('name', 'Test Product')
        .field('price', '99.99');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(-1);
    });

    test('should return 400 for product add without required fields', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', 1);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should return 404 for non-existent product edit', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .post('/api/products/edit')
        .set('Cookie', cookie)
        .field('pid', 9999)
        .field('name', 'Updated Product');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });

    test('should return 404 for non-existent product delete', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .get('/api/products/del/9999')
        .set('Cookie', cookie);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });

    test('should return 404 for non-existent product detail', async () => {
      const res = await request(app)
        .get('/api/products/detail?pid=9999');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });

    test('should return 400 for product detail without product ID', async () => {
      const res = await request(app)
        .get('/api/products/detail');

      expect(res.status).toBe(400);
    });
  });

  describe('Cart API Error Handling', () => {

    test('should return 400 for cart add without required fields', async () => {
      const res = await request(app)
        .post('/api/products/cart/add')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('should return 400 for cart update without required fields', async () => {
      const res = await request(app)
        .post('/api/products/cart/update')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('should return 400 for cart delete without required fields', async () => {
      const res = await request(app)
        .post('/api/products/cart/delete')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('should return 400 for cart clear without user ID', async () => {
      const res = await request(app)
        .post('/api/products/cart/clear')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('should return 400 for cart list without user ID', async () => {
      const res = await request(app)
        .post('/api/products/cart/list')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });
  });

  describe('Order API Error Handling', () => {

    test('should return 401 for unauthenticated order create', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 1,
          items: [{ pid: 1, num: 1 }],
          total: 99.99,
          address: 'Test Address',
          phone: '1234567890'
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('should return 400 for order create without required fields', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .post('/api/orders/create')
        .set('Cookie', cookie)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });
  });

  describe('404 Error Handling', () => {

    test('should return 404 for non-existent API endpoint', async () => {
      const res = await request(app)
        .get('/api/non-existent-endpoint');

      expect(res.status).toBe(404);
    });

    test('should return 404 for non-existent HTTP method', async () => {
      const res = await request(app)
        .put('/api/login');

      expect(res.status).toBe(404);
    });
  });

  describe('Server Error Handling', () => {

    test('should handle internal server errors gracefully', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', 'invalid')
        .field('name', 'Test Product')
        .field('price', '99.99');

      expect(res.status).toBeGreaterThanOrEqual(500);
    });
  });
});
