const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

describe('Cart Edge Cases Tests', () => {

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

  describe('POST /api/products/cart/add', () => {

    test('should fail with negative quantity', async () => {
      const res = await request(app)
        .post('/api/products/cart/add')
        .send({
          userid: 1,
          pid: 1,
          num: -1
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });

    test('should fail with zero quantity', async () => {
      const res = await request(app)
        .post('/api/products/cart/add')
        .send({
          userid: 1,
          pid: 1,
          num: 0
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });

    test('should fail with large quantity', async () => {
      const res = await request(app)
        .post('/api/products/cart/add')
        .send({
          userid: 1,
          pid: 1,
          num: 999999999
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });

    test('should fail with non-existent product ID', async () => {
      const res = await request(app)
        .post('/api/products/cart/add')
        .send({
          userid: 1,
          pid: 9999,
          num: 1
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });

    test('should fail with non-numeric user ID', async () => {
      const res = await request(app)
        .post('/api/products/cart/add')
        .send({
          userid: 'invalid',
          pid: 1,
          num: 1
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('should fail with non-numeric product ID', async () => {
      const res = await request(app)
        .post('/api/products/cart/add')
        .send({
          userid: 1,
          pid: 'invalid',
          num: 1
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('should fail with non-numeric quantity', async () => {
      const res = await request(app)
        .post('/api/products/cart/add')
        .send({
          userid: 1,
          pid: 1,
          num: 'invalid'
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });
  });

  describe('POST /api/products/cart/update', () => {

    test('should fail with negative quantity', async () => {
      const res = await request(app)
        .post('/api/products/cart/update')
        .send({
          userid: 1,
          pid: 1,
          num: -1
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });

    test('should fail with zero quantity', async () => {
      const res = await request(app)
        .post('/api/products/cart/update')
        .send({
          userid: 1,
          pid: 1,
          num: 0
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });

    test('should fail with large quantity', async () => {
      const res = await request(app)
        .post('/api/products/cart/update')
        .send({
          userid: 1,
          pid: 1,
          num: 999999999
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });
  });

  describe('POST /api/products/cart/delete', () => {

    test('should handle non-existent cart item', async () => {
      const res = await request(app)
        .post('/api/products/cart/delete')
        .send({
          userid: 1,
          pid: 9999
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });
  });

  describe('POST /api/products/cart/clear', () => {

    test('should return empty cart after clearing', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });

      const catid = await new Promise((resolve, reject) => {
        db.get('SELECT catid FROM categories WHERE name = ?', ['Test Category'], (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.catid : null);
        });
      });

      const addRes = await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', catid)
        .field('name', 'Test Product')
        .field('price', '99.99')
        .field('description', 'Test Description');

      const pid = addRes.body.data.pid;

      await request(app)
        .post('/api/products/cart/add')
        .send({
          userid: 1,
          pid: pid,
          num: 2
        });

      await request(app)
        .post('/api/products/cart/clear')
        .send({ userid: 1 });

      const listRes = await request(app)
        .post('/api/products/cart/list')
        .send({ userid: 1 });

      expect(listRes.status).toBe(200);
      expect(listRes.body.code).toBe(0);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      expect(listRes.body.data.length).toBe(0);
    });

    test('should handle clearing empty cart', async () => {
      const res = await request(app)
        .post('/api/products/cart/clear')
        .send({ userid: 1 });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });
  });

  describe('POST /api/products/cart/list', () => {

    test('should return empty cart for unlogged user', async () => {
      const res = await request(app)
        .post('/api/products/cart/list')
        .send({ userid: 9999 });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    test('should fail with missing user ID', async () => {
      const res = await request(app)
        .post('/api/products/cart/list')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });
  });
});
