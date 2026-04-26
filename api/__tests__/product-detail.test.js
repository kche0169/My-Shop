const { request, createTestApp, db } = require('./setup');

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

describe('Product Detail Tests', () => {

  beforeEach((done) => {
    db.run('DELETE FROM products', (err) => {
      if (err) console.error('Clear products failed:', err.message);
      db.run('DELETE FROM categories', (err) => {
        if (err) console.error('Clear categories failed:', err.message);
        done();
      });
    });
  });

  describe('GET /api/products/list', () => {

    test('should return all products', async () => {
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

      await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', catid)
        .field('name', 'Product 1')
        .field('price', '99.99')
        .field('description', 'Description 1');

      await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', catid)
        .field('name', 'Product 2')
        .field('price', '199.99')
        .field('description', 'Description 2');

      const res = await request(app)
        .get('/api/products/list');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    }, 30000);

    test('should filter products by category', async () => {
      jest.setTimeout(30000);
      
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });

      const cookie = loginRes.headers['set-cookie'][0];

      await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Category 1' });

      await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Category 2' });

      const catid1 = await getCatidByName('Category 1');
      const catid2 = await getCatidByName('Category 2');

      await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', catid1)
        .field('name', 'Product 1')
        .field('price', '99.99')
        .field('description', 'Description 1');

      await request(app)
        .post('/api/products/add')
        .set('Cookie', cookie)
        .field('catid', catid2)
        .field('name', 'Product 2')
        .field('price', '199.99')
        .field('description', 'Description 2');

      const res = await request(app)
        .get(`/api/products/list?catid=${catid1}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].catid).toBe(catid1);
    }, 30000);

    test('should return empty array when no products exist', async () => {
      const res = await request(app)
        .get('/api/products/list');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    test('should return empty array for non-existent category', async () => {
      const res = await request(app)
        .get('/api/products/list?catid=9999');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/products/detail', () => {

    test('should return product detail successfully', async () => {
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
        .field('description', 'Test Description')
        .field('long_description', 'Long Test Description');

      const pid = addRes.body.data.pid;

      const res = await request(app)
        .get(`/api/products/detail?pid=${pid}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.pid).toBe(pid);
      expect(res.body.data.name).toBe('Test Product');
      expect(res.body.data.price).toBe(99.99);
    });

    test('should fail with non-existent product ID', async () => {
      const res = await request(app)
        .get('/api/products/detail?pid=9999');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
      expect(res.body.msg).toBe('商品不存在');
    });

    test('should fail with missing product ID', async () => {
      const res = await request(app)
        .get('/api/products/detail');

      expect(res.status).toBe(400);
    });

    test('should fail with invalid product ID', async () => {
      const res = await request(app)
        .get('/api/products/detail?pid=invalid');

      expect(res.status).toBe(400);
    });
  });
});
