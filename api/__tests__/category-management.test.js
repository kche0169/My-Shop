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

describe('Category Management Tests', () => {
  
  beforeEach((done) => {
    db.run('DELETE FROM categories', (err) => {
      if (err) console.error('Clear categories failed:', err.message);
      db.run('DELETE FROM products', (err) => {
        if (err) console.error('Clear products failed:', err.message);
        done();
      });
    });
  });

  describe('POST /api/cate/add', () => {
    
    test('should add category successfully as admin', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.msg).toBe('Category added successfully');
    });

    test('should fail with duplicate category name', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });
      
      const res = await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('should fail with empty category name', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: '' });
      
      expect(res.status).toBe(400);
    });

    test('should fail when not logged in', async () => {
      const res = await request(app)
        .post('/api/cate/add')
        .send({ name: 'Test Category' });
      
      expect(res.status).toBe(401);
    });

    test('should fail when logged in as normal user', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Test Category' });
      
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/cate/edit', () => {
    
    test('should edit category successfully as admin', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      await request(app)
        .post('/api/cate/add')
        .set('Cookie', cookie)
        .send({ name: 'Old Category' });
      
      const catid = await getCatidByName('Old Category');
      
      const res = await request(app)
        .post('/api/cate/edit')
        .set('Cookie', cookie)
        .send({ catid, name: 'New Category' });
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.msg).toBe('Category updated successfully');
    });

    test('should fail with non-existent category ID', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .post('/api/cate/edit')
        .set('Cookie', cookie)
        .send({ catid: 9999, name: 'Test Category' });
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('should fail with empty category name', async () => {
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
        .post('/api/cate/edit')
        .set('Cookie', cookie)
        .send({ catid, name: '' });
      
      expect(res.status).toBe(400);
    });

    test('should fail when not logged in', async () => {
      const res = await request(app)
        .post('/api/cate/edit')
        .send({ catid: 1, name: 'Test Category' });
      
      expect(res.status).toBe(401);
    });

    test('should fail when logged in as normal user', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .post('/api/cate/edit')
        .set('Cookie', cookie)
        .send({ catid: 1, name: 'Test Category' });
      
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/cate/del/:catid', () => {
    
    test('should delete category successfully as admin', async () => {
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
        .get(`/api/cate/del/${catid}`)
        .set('Cookie', cookie);
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.msg).toBe('Category deleted successfully');
    });

    test('should delete category with products (cascade delete)', async () => {
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
        .field('name', 'Test Product')
        .field('price', '99.99')
        .field('description', 'Test Description')
        .field('long_description', 'Long Test Description');
      
      const res = await request(app)
        .get(`/api/cate/del/${catid}`)
        .set('Cookie', cookie);
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });

    test('should fail when not logged in', async () => {
      const res = await request(app)
        .get('/api/cate/del/1');
      
      expect(res.status).toBe(401);
    });

    test('should fail when logged in as normal user', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .get('/api/cate/del/1')
        .set('Cookie', cookie);
      
      expect(res.status).toBe(403);
    });
  });
});
