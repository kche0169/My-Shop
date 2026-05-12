/**
 * 分页功能测试
 * 覆盖场景：
 * A. 基础分页
 * B. 按分类分页
 * C. 分页边界情况
 * D. 分页数据验证
 */

const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

describe('Pagination Feature', () => {
  describe('A. Basic Pagination', () => {
    test('A1: Get first page with default limit', async () => {
      const res = await request(app)
        .get('/api/products/list?page=1');
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(8);
    });

    test('A2: Get page with custom limit', async () => {
      const res = await request(app)
        .get('/api/products/list?page=1&limit=4');
      
      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(4);
      expect(res.body.pagination.totalPages).toBeGreaterThan(1);
    });

    test('A3: Pagination metadata is correct', async () => {
      const res = await request(app)
        .get('/api/products/list?page=1&limit=4');
      
      const { pagination } = res.body;
      
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      expect(pagination).toHaveProperty('hasNextPage');
      expect(pagination).toHaveProperty('hasPrevPage');
      expect(pagination.totalPages).toBe(Math.ceil(pagination.total / pagination.limit));
    });

    test('A4: Get second page', async () => {
      const page1Res = await request(app)
        .get('/api/products/list?page=1&limit=4');
      const page2Res = await request(app)
        .get('/api/products/list?page=2&limit=4');
      
      expect(page1Res.body.pagination.page).toBe(1);
      expect(page2Res.body.pagination.page).toBe(2);
      
      const page1Ids = page1Res.body.data.map(p => p.pid);
      const page2Ids = page2Res.body.data.map(p => p.pid);
      
      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      expect(overlap.length).toBe(0);
    });
  });

  describe('B. Pagination with Category Filter', () => {
    test('B1: Get first page filtered by category', async () => {
      const catId = 1;
      const res = await request(app)
        .get(`/api/products/list?catid=${catId}&page=1&limit=2`);
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      
      const { data, pagination } = res.body;
      expect(data.every(p => p.catid === catId)).toBe(true);
      expect(pagination.total).toBeGreaterThan(0);
    });

    test('B2: Category pagination has correct total', async () => {
      const catId = 2;
      
      const page1Res = await request(app)
        .get(`/api/products/list?catid=${catId}&page=1&limit=2`);
      const page2Res = await request(app)
        .get(`/api/products/list?catid=${catId}&page=2&limit=2`);
      
      const totalFromPage1 = page1Res.body.pagination.total;
      const totalFromPage2 = page2Res.body.pagination.total;
      
      expect(totalFromPage1).toBe(totalFromPage2);
      expect(page1Res.body.data.every(p => p.catid === catId)).toBe(true);
      expect(page2Res.body.data.every(p => p.catid === catId)).toBe(true);
    });
  });

  describe('C. Pagination Edge Cases', () => {
    test('C1: Invalid page number defaults to 1', async () => {
      const res = await request(app)
        .get('/api/products/list?page=-1');
      
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
    });

    test('C2: Non-numeric page defaults to 1', async () => {
      const res = await request(app)
        .get('/api/products/list?page=abc');
      
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
    });

    test('C3: Limit is capped at 50', async () => {
      const res = await request(app)
        .get('/api/products/list?limit=100');
      
      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(50);
    });

    test('C4: Zero limit defaults to 8', async () => {
      const res = await request(app)
        .get('/api/products/list?limit=0');
      
      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(8);
    });

    test('C5: Page beyond total returns empty data', async () => {
      const res = await request(app)
        .get('/api/products/list?page=9999');
      
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(9999);
      expect(res.body.data).toEqual([]);
    });

    test('C6: hasNextPage/hasPrevPage logic', async () => {
      const page1Res = await request(app)
        .get('/api/products/list?page=1&limit=100');
      
      const { hasNextPage, hasPrevPage } = page1Res.body.pagination;
      
      if (page1Res.body.pagination.totalPages <= 1) {
        expect(hasNextPage).toBe(false);
      }
      expect(hasPrevPage).toBe(false);
    });
  });

  describe('D. Pagination Data Validation', () => {
    test('D1: All products have required fields', async () => {
      const res = await request(app)
        .get('/api/products/list?page=1&limit=2');
      
      const { data } = res.body;
      expect(data.length).toBeGreaterThan(0);
      
      data.forEach(product => {
        expect(product).toHaveProperty('pid');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('catid');
        expect(product).toHaveProperty('cateName');
      });
    });

    test('D2: Products are sorted by pid', async () => {
      const res = await request(app)
        .get('/api/products/list?page=1&limit=10');
      
      const { data } = res.body;
      const ids = data.map(p => p.pid);
      const sortedIds = [...ids].sort((a, b) => a - b);
      
      expect(ids).toEqual(sortedIds);
    });

    test('D3: Response time is reasonable', async () => {
      const start = Date.now();
      await request(app).get('/api/products/list?page=1&limit=20');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000);
    });
  });
});