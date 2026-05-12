const seoProductDetail = (req, res) => {
  const { catIdName, productIdName } = req.params;
  
  // 解析分类ID：格式如 "2-Fruits" → 提取 "2"
  const catIdMatch = catIdName.match(/^(\d+)-/);
  const catId = catIdMatch ? parseInt(catIdMatch[1]) : null;
  
  // 解析商品ID：格式如 "9-Apple" → 提取 "9"
  const productIdMatch = productIdName.match(/^(\d+)-/);
  const productId = productIdMatch ? parseInt(productIdMatch[1]) : null;
  
  if (!catId || !productId || isNaN(catId) || isNaN(productId)) {
    return res.status(400).json({ code: -1, msg: 'Invalid URL format' });
  }
  
  const db = req.app.get('db');
  
  // 查询商品详情
  db.get(
    'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.catid = c.catid WHERE p.pid = ?',
    [productId],
    (err, product) => {
      if (err) {
        return res.status(500).json({ code: -1, msg: 'Database error' });
      }
      
      if (!product) {
        return res.status(404).json({ code: -1, msg: 'Product not found' });
      }
      
      // 验证分类匹配
      if (product.catid !== catId) {
        return res.status(404).json({ code: -1, msg: 'Product not found in this category' });
      }
      
      res.json({ 
        code: 0, 
        data: {
          pid: product.pid,
          name: product.name,
          price: product.price,
          description: product.description,
          catid: product.catid,
          category_name: product.category_name,
          img_path: product.img_path,
          img_path2: product.img_path2,
          img_path3: product.img_path3,
          img_path4: product.img_path4,
          seo_url: `/${catId}-${product.category_name}/${productId}-${product.name}`
        }
      });
    }
  );
};

module.exports = seoProductDetail;