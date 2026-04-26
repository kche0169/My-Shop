const { request, createTestApp, db } = require('./setup');
const fs = require('fs');
const path = require('path');

let app;

beforeAll(() => {
  app = createTestApp();
});

const getCatidByName = (name) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT catid FROM categories WHERE name = ?', [name], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.catid : null);
    });
  });
};

describe('Product Management Tests', () => {

  beforeEach((done) => {
    db.run('DELETE FROM products', (err) => {
      if (err) console.error('Clear products failed:', err.message);
      db.run('DELETE FROM categories', (err) => {
        if (err) console.error('Clear categories failed:', err.message);
        done();
      });
    });
  });

  describe('POST /api/products/add', () => {

    test('should add product successfully as admin', async () => {
      jest.setTimeout(30000);
      
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });

      const catid = await getCatidByName('Test Category');

      const res = await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', catid)
        .field('name', 'Test Product')
        .field('price', '99.99')
        .field('description', 'Test Description')
        .field('long_description', 'Long Test Description');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.msg).toBe('商品添加成功');
    }, 30000);

    test('should add product with image upload', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });

      const catid = await getCatidByName('Test Category');

      const testImagePath = path.join(__dirname, '../../public/images/electronics/wireless_blueteeth_headphone/wireless_blueteeth_headphone.jpg');

      const res = await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', catid)
        .field('name', 'Test Product with Image')
        .field('price', '199.99')
        .field('description', 'Test Description')
        .field('long_description', 'Long Test Description')
        .attach('proImg', testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });

    test('should fail with invalid price', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });

      const catid = await getCatidByName('Test Category');

      const res = await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', catid)
        .field('name', 'Test Product')
        .field('price', 'invalid')
        .field('description', 'Test Description');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should fail with non-image file upload', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });

      const catid = await getCatidByName('Test Category');

      const testTextPath = path.join(__dirname, 'setup.js');

      const res = await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', catid)
        .field('name', 'Test Product')
        .field('price', '99.99')
        .field('description', 'Test Description')
        .attach('proImg', testTextPath);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should fail when not logged in', async () => {
      const res = await request(app)
        .post('/api/products/add')
        .field('catid', '1')
        .field('name', 'Test Product')
        .field('price', '99.99')
        .field('description', 'Test Description');

      expect(res.status).toBe(401);
    });

    test('should fail when logged in as normal user', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', '1')
        .field('name', 'Test Product')
        .field('price', '99.99')
        .field('description', 'Test Description');

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/products/edit', () => {

    test('should edit product successfully as admin', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });

      const catid = await getCatidByName('Test Category');

      const addRes = await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', catid)
        .field('name', 'Old Product')
        .field('price', '99.99')
        .field('description', 'Old Description');

      const pid = addRes.body.data.pid;

      const res = await request(app)
        .post('/api/products/edit')
        .set('Cookie', cookie)
        .field('pid', pid)
        .field('catid', catid)
        .field('name', 'New Product')
        .field('price', '199.99')
        .field('description', 'New Description')
        .field('long_description', 'New Long Description');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.msg).toBe('商品编辑成功');
    });

    test('should edit product with image replacement', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });

      const catid = await getCatidByName('Test Category');

      const addRes = await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', catid)
        .field('name', 'Test Product')
        .field('price', '99.99')
        .field('description', 'Test Description');

      const pid = addRes.body.data.pid;

      const testImagePath = path.join(__dirname, '../../public/images/electronics/wireless_blueteeth_headphone/wireless_blueteeth_headphone.jpg');

      const res = await request(app)
        .post('/api/products/edit')
        .set('Cookie', cookie)
        .field('pid', pid)
        .field('catid', catid)
        .field('name', 'Product with New Image')
        .field('price', '199.99')
        .field('description', 'Updated Description')
        .attach('proImg', testImagePath);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });

    test('should fail when not logged in', async () => {
      const res = await request(app)
        .post('/api/products/edit')
        .field('pid', '1')
        .field('catid', '1')
        .field('name', 'Test Product')
        .field('price', '99.99')
        .field('description', 'Test Description');

      expect(res.status).toBe(401);
    });

    test('should fail when logged in as normal user', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .post('/api/products/edit')
        .set('Cookie', cookie)
        .field('pid', '1')
        .field('catid', '1')
        .field('name', 'Test Product')
        .field('price', '99.99')
        .field('description', 'Test Description');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/products/del/:pid', () => {

    test('should delete product successfully as admin', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });

      const catid = await getCatidByName('Test Category');

      const addRes = await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', catid)
        .field('name', 'Test Product')
        .field('price', '99.99')
        .field('description', 'Test Description');

      const pid = addRes.body.data.pid;

      const res = await request(app)
        .get(`/api/products/del/${pid}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.msg).toBe('商品删除成功');
    });

    test('should fail when not logged in', async () => {
      const res = await request(app)
        .get('/api/products/del/1');

      expect(res.status).toBe(401);
    });

    test('should fail when logged in as normal user', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .get('/api/products/del/1')
        .set('Cookie', cookie);

      expect(res.status).toBe(403);
    });
  });
});
