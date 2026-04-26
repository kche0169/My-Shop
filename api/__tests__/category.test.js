const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

describe('Category API Tests', () => {

  describe('GET /api/cate/all', () => {
    test('should return all categories', async () => {
      const res = await request(app).get('/api/cate/all');

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('should have valid category structure', async () => {
      const res = await request(app).get('/api/cate/all');

      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        const category = res.body.data[0];
        expect(category).toHaveProperty('catid');
        expect(category).toHaveProperty('name');
        expect(typeof category.catid).toBe('number');
        expect(typeof category.name).toBe('string');
      }
    });

    test('should contain default categories', async () => {
      const res = await request(app).get('/api/cate/all');

      expect(res.status).toBe(200);
      const categoryNames = res.body.data.map(c => c.name);
      expect(categoryNames).toContain('Electronics');
      expect(categoryNames).toContain('Fashion');
    });
  });

});