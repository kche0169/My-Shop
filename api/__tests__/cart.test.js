const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

describe('Cart API Tests', () => {

  const TEST_USERID = 2;

  describe('POST /api/products/cart/list', () => {
    test('should return cart items for user', async () => {
      const res = await request(app)
        .post('/api/products/cart/list')
        .send({ userid: TEST_USERID });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('should reject missing userid', async () => {
      const res = await request(app)
        .post('/api/products/cart/list')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });
  });

  describe('POST /api/products/cart/clear', () => {
    test('should clear user cart', async () => {
      const res = await request(app)
        .post('/api/products/cart/clear')
        .send({ userid: TEST_USERID });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });

    test('should reject missing userid', async () => {
      const res = await request(app)
        .post('/api/products/cart/clear')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });
  });

});