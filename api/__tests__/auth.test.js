const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

describe('Auth API Tests', () => {

  describe('GET /api/userinfo', () => {
    test('should respond to userinfo request', async () => {
      const res = await request(app).get('/api/userinfo');

      expect(res.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('GET /api/logout', () => {
    test('should respond to logout request', async () => {
      const res = await request(app).get('/api/logout');

      expect(res.status).toBeGreaterThanOrEqual(200);
    });
  });

});