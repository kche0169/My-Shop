const seoCategoryList = (req, res) => {
  const { catIdName } = req.params;
  
  // 解析分类ID：格式如 "2-Fruits" → 提取 "2"
  const catIdMatch = catIdName.match(/^(\d+)-/);
  const catId = catIdMatch ? parseInt(catIdMatch[1]) : null;
  
  if (!catId || isNaN(catId)) {
    return res.status(400).json({ code: -1, msg: 'Invalid URL format' });
  }
  
  const db = req.app.get('db');
  
  // 查询分类信息和该分类下的商品
  db.get('SELECT * FROM categories WHERE catid = ?', [catId], (err, category) => {
    if (err) {
      return res.status(500).json({ code: -1, msg: 'Database error' });
    }
    
    if (!category) {
      return res.status(404).json({ code: -1, msg: 'Category not found' });
    }
    
    // 查询该分类下的所有商品
    db.all('SELECT * FROM products WHERE catid = ?', [catId], (err, products) => {
      if (err) {
        return res.status(500).json({ code: -1, msg: 'Database error' });
      }
      
      // 为每个商品生成 SEO URL
      const productsWithSeoUrl = products.map(product => ({
        ...product,
        seo_url: `/${catId}-${category.name}/${product.pid}-${product.name}`
      }));
      
      res.json({
        code: 0,
        data: {
          catid: category.catid,
          name: category.name,
          description: category.description || '',
          seo_url: `/${catId}-${category.name}/`,
          products: productsWithSeoUrl
        }
      });
    });
  });
};

module.exports = seoCategoryList;