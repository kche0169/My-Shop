const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

describe('Orders API Tests', () => {

  describe('POST /api/orders/create', () => {
    test('should reject order with empty items', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({ userid: 1, items: [] });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('should reject order without userid', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({ items: [{ pid: 1, num: 1 }] });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('should reject order without items', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({ userid: 1 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });
  });

});