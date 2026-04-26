const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

beforeEach((done) => {
  db.run('DELETE FROM orders', (err) => {
    if (err) console.error('Clear orders failed:', err.message);
    done();
  });
});

describe('Orders API Tests', () => {
  
  describe('POST /api/orders/create', () => {
    
    test('should create order successfully with valid items', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: [{ pid: 1, num: 2 }]
        });
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toHaveProperty('orderId');
      expect(res.body.data).toHaveProperty('paypalOrderId');
      expect(res.body.data).toHaveProperty('approvalLink');
    });

    test('should fail with invalid userid (userid < 1)', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 0,
          items: [{ pid: 1, num: 2 }]
        });
      
      expect(res.status).toBe(400);
    });

    test('should fail with empty items array', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: []
        });
      
      expect(res.status).toBe(400);
    });

    test('should fail with missing userid', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          items: [{ pid: 1, num: 2 }]
        });
      
      expect(res.status).toBe(400);
    });

    test('should fail with invalid product id (pid < 1)', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: [{ pid: -1, num: 2 }]
        });
      
      expect(res.status).toBe(400);
    });

    test('should fail with invalid quantity (num < 1)', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: [{ pid: 1, num: 0 }]
        });
      
      expect(res.status).toBe(400);
    });

    test('should skip invalid products and create order with valid ones', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: [
            { pid: 9999, num: 1 },
            { pid: 1, num: 2 }
          ]
        });
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });

    test('should fail when all items are invalid', async () => {
      const res = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: [
            { pid: 9999, num: 1 },
            { pid: 8888, num: 2 }
          ]
        });
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });
  });

  describe('GET /api/orders/admin/all - Admin 获取所有订单', () => {
    
    test('should return 401 when not logged in', async () => {
      const res = await request(app)
        .get('/api/orders/admin/all');
      
      expect(res.status).toBe(401);
    });

    test('should return 403 when logged in as normal user (not admin)', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .get('/api/orders/admin/all')
        .set('Cookie', cookie);
      
      expect(res.status).toBe(403);
      expect(res.body.msg).toBe('Admin access required');
    });

    test('should return all orders when logged in as admin', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const adminCookie = loginRes.headers['set-cookie'][0];

      const insertOrder = (userid, total, callback) => {
        const items = JSON.stringify([{ pid: 1, num: 1, price: 199.99 }]);
        const salt = 'test_salt_' + Math.random().toString(36).substr(2, 9);
        const digest = 'test_digest_' + Math.random().toString(36).substr(2, 9);
        
        db.run(
          `INSERT INTO orders (userid, items_json, total_price, currency, digest, status, merchant_email, salt) 
           VALUES (?, ?, ?, 'USD', ?, 'PENDING', 'admin@shop.com', ?)`,
          [userid, items, total, digest, salt],
          callback
        );
      };

      await new Promise((resolve) => {
        insertOrder(2, 199.99, () => {
          insertOrder(2, 399.98, () => {
            insertOrder(3, 89.99, resolve);
          });
        });
      });

      const res = await request(app)
        .get('/api/orders/admin/all')
        .set('Cookie', adminCookie);
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    test('should return empty array when no orders exist', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'admin@shop.com', password: 'Admin123!' });
      
      const adminCookie = loginRes.headers['set-cookie'][0];
      
      const res = await request(app)
        .get('/api/orders/admin/all')
        .set('Cookie', adminCookie);
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/orders/user/recent - User 获取最近订单', () => {
    
    test('should return 401 when not logged in', async () => {
      const res = await request(app)
        .get('/api/orders/user/recent');
      
      expect(res.status).toBe(401);
      expect(res.body.code).toBe(-1);
      expect(res.body.msg).toBe('Please login first');
    });

    test('should return at most 5 recent orders for logged-in user', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];

      const insertOrder = (userid, items, total, status, callback) => {
        const salt = 'test_salt_' + Math.random().toString(36).substr(2, 9);
        const digest = 'test_digest_' + Math.random().toString(36).substr(2, 9);
        
        db.run(
          `INSERT INTO orders (userid, items_json, total_price, currency, digest, status, merchant_email, salt) 
           VALUES (?, ?, ?, 'USD', ?, ?, 'admin@shop.com', ?)`,
          [userid, JSON.stringify(items), total, digest, status, salt],
          callback
        );
      };

      await new Promise((resolve) => {
        const items1 = [{ pid: 1, num: 1, price: 199.99 }];
        const items2 = [{ pid: 2, num: 2, price: 299.99 }];
        const items3 = [{ pid: 3, num: 1, price: 149.99 }];
        const items4 = [{ pid: 4, num: 1, price: 999.99 }];
        const items5 = [{ pid: 5, num: 3, price: 279.99 }];
        const items6 = [{ pid: 6, num: 1, price: 49.99 }];
        const items7 = [{ pid: 7, num: 2, price: 249.99 }];

        insertOrder(2, items1, 199.99, 'PAID', () => {
          insertOrder(2, items2, 599.98, 'PAID', () => {
            insertOrder(2, items3, 149.99, 'PENDING', () => {
              insertOrder(2, items4, 999.99, 'PAID', () => {
                insertOrder(2, items5, 839.97, 'PAID', () => {
                  insertOrder(2, items6, 49.99, 'PAID', () => {
                    insertOrder(2, items7, 499.98, 'PAID', resolve);
                  });
                });
              });
            });
          });
        });
      });

      const res = await request(app)
        .get('/api/orders/user/recent')
        .set('Cookie', cookie);
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    test('should only return orders belonging to the logged-in user', async () => {
      const loginRes = await request(app)
        .post('/api/login')
        .send({ email: 'user@shop.com', password: 'User123!' });
      
      const cookie = loginRes.headers['set-cookie'][0];

      const insertOrder = (userid, total, callback) => {
        const items = JSON.stringify([{ pid: 1, num: 1, price: 199.99 }]);
        const salt = 'test_salt_' + Math.random().toString(36).substr(2, 9);
        const digest = 'test_digest_' + Math.random().toString(36).substr(2, 9);
        
        db.run(
          `INSERT INTO orders (userid, items_json, total_price, currency, digest, status, merchant_email, salt) 
           VALUES (?, ?, ?, 'USD', ?, 'PAID', 'admin@shop.com', ?)`,
          [userid, items, total, digest, salt],
          callback
        );
      };

      await new Promise((resolve) => {
        insertOrder(2, 199.99, () => {
          insertOrder(2, 399.98, () => {
            insertOrder(3, 599.97, resolve);
          });
        });
      });

      const res = await request(app)
        .get('/api/orders/user/recent')
        .set('Cookie', cookie);
      
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      res.body.data.forEach(order => {
        expect(order.userid).toBe(2);
      });
    });

    test('should return 401 with invalid session', async () => {
      const res = await request(app)
        .get('/api/orders/user/recent')
        .set('Cookie', 'connect.sid=invalid_session_token');
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/orders/paypal/success', () => {
    
    test('should redirect to index.html', async () => {
      const res = await request(app)
        .get('/api/orders/paypal/success');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/index.html');
    });

    test('should update order status when token provided', async () => {
      const createRes = await request(app)
        .post('/api/orders/create')
        .send({
          userid: 2,
          items: [{ pid: 1, num: 1 }]
        });
      
      const paypalOrderId = createRes.body.data.paypalOrderId;
      
      const successRes = await request(app)
        .get(`/api/orders/paypal/success?token=${paypalOrderId}`);
      
      expect(successRes.status).toBe(302);
    });
  });
});
