const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

describe('Products API Tests', () => {

  describe('GET /api/products/list', () => {
    test('should return product list', async () => {
      const res = await request(app).get('/api/products/list');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('should have valid product structure', async () => {
      const res = await request(app).get('/api/products/list');

      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        const product = res.body.data[0];
        expect(product).toHaveProperty('pid');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
      }
    });
  });

  describe('GET /api/products/detail', () => {
    test('should return product details', async () => {
      const listRes = await request(app).get('/api/products/list');
      const pid = listRes.body.data[0]?.pid;

      if (pid) {
        const res = await request(app).get(`/api/products/detail?pid=${pid}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('name');
      }
    });

    test('should return error for invalid pid', async () => {
      const res = await request(app).get('/api/products/detail?pid=99999');

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.code).toBe(-1);
    });
  });

});