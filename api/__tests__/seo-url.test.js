/**
 * SEO 友好 URL 测试
 * 覆盖场景：
 * A. 分类 SEO URL 访问
 * B. 商品 SEO URL 访问
 * C. URL 格式验证
 */

const { request, createTestApp, db } = require('./setup');

let app;

beforeAll(() => {
  app = createTestApp();
});

describe('SEO Friendly URLs', () => {
  // 使用已存在的分类和商品数据进行测试
  const existingCatId = 1; // Electronics
  const existingCatName = 'Electronics';
  const existingProductId = 1; // 第一个商品

  describe('A. Category SEO URL', () => {
    test('A1: Access category via SEO URL /:catId-name', async () => {
      const res = await request(app)
        .get(`/api/cate/seo/${existingCatId}-${existingCatName}`);
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.catid).toBe(existingCatId);
      expect(res.body.data.name).toBe(existingCatName);
      expect(res.body.data.seo_url).toBe(`/${existingCatId}-${existingCatName}/`);
    });

    test('A2: Invalid category URL format returns error', async () => {
      const res = await request(app)
        .get('/api/cate/seo/invalid-url');
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('A3: Non-existent category returns 404', async () => {
      const res = await request(app)
        .get('/api/cate/seo/9999-NonExistent');
      
      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });
  });

  describe('B. Product SEO URL', () => {
    test('B1: Access product via SEO URL /:catId-name/:pid-name', async () => {
      // 查询数据库获取真实的商品数据
      const product = await new Promise((resolve) => {
        db.get('SELECT * FROM products WHERE pid = ?', [existingProductId], (err, row) => {
          resolve(row);
        });
      });

      const res = await request(app)
        .get(`/api/products/seo/${product.catid}-${existingCatName}/${product.pid}-${product.name}`);
      
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.pid).toBe(product.pid);
      expect(res.body.data.name).toBe(product.name);
      expect(res.body.data.seo_url).toBe(`/${product.catid}-${existingCatName}/${product.pid}-${product.name}`);
    });

    test('B2: Invalid product URL format returns error', async () => {
      const res = await request(app)
        .get('/api/products/seo/invalid/product');
      
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(-1);
    });

    test('B3: Non-existent product returns 404', async () => {
      const res = await request(app)
        .get(`/api/products/seo/${existingCatId}-${existingCatName}/9999-NonExistent`);
      
      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });

    test('B4: Category-product mismatch returns 404', async () => {
      // 获取真实商品ID，但使用错误的分类ID
      const product = await new Promise((resolve) => {
        db.get('SELECT * FROM products WHERE pid = ?', [existingProductId], (err, row) => {
          resolve(row);
        });
      });

      const res = await request(app)
        .get(`/api/products/seo/9999-WrongCategory/${product.pid}-${product.name}`);
      
      expect(res.status).toBe(404);
      expect(res.body.code).toBe(-1);
    });
  });

  describe('C. SEO URL with existing data', () => {
    test('C1: All existing categories support SEO URL', async () => {
      const categories = await new Promise((resolve) => {
        db.all('SELECT * FROM categories', (err, rows) => {
          resolve(rows);
        });
      });

      for (const category of categories) {
        const res = await request(app)
          .get(`/api/cate/seo/${category.catid}-${category.name}`);
        
        expect(res.status).toBe(200);
        expect(res.body.data.seo_url).toBe(`/${category.catid}-${category.name}/`);
      }
    });

    test('C2: All existing products support SEO URL', async () => {
      const products = await new Promise((resolve) => {
        db.all('SELECT * FROM products', (err, rows) => {
          resolve(rows);
        });
      });

      for (const product of products) {
        const category = await new Promise((resolve) => {
          db.get('SELECT * FROM categories WHERE catid = ?', [product.catid], (err, row) => {
            resolve(row);
          });
        });

        const res = await request(app)
          .get(`/api/products/seo/${product.catid}-${category.name}/${product.pid}-${product.name}`);
        
        expect(res.status).toBe(200);
        expect(res.body.data.seo_url).toBe(`/${product.catid}-${category.name}/${product.pid}-${product.name}`);
      }
    });
  });
});