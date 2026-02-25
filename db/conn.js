const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接项目根目录的shop.db数据库（不存在会自动创建）
const db = new sqlite3.Database(
  path.join(__dirname, '../shop.db'),
  (err) => {
    if (err) console.error('数据库连接失败：', err.message);
    else console.log('SQLite数据库连接成功！');
  }
);

// 建表+初始化测试数据（执行一次后可注释，避免重复建表）
db.serialize(() => {
  // 1. 建分类表：catid(主键)、name
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    catid INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`);

  // 2. 建产品表：pid(主键)、catid(关联分类)、name、price、description、img_path(存图片路径，作业要求)
  db.run(`CREATE TABLE IF NOT EXISTS products (
    pid INTEGER PRIMARY KEY AUTOINCREMENT,
    catid INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    img_path TEXT,  # 存主图路径，缩率图路径可后缀区分（如pid_thumb.jpg）
    FOREIGN KEY (catid) REFERENCES categories(catid)
  )`);

  // 3. 插入测试数据（最少2分类，每分类2产品，可改自己的分类/产品名）
  // 先清空表（测试用，正式环境删除）
  db.run('DELETE FROM products');
  db.run('DELETE FROM categories');
  // 插入分类
  const insertCate = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  insertCate.run('Electronics'); // 分类1：电子
  insertCate.run('Fashion');     // 分类2：时尚
  insertCate.finalize();
  // 插入产品（catid=1对应电子，catid=2对应时尚）
  const insertPro = db.prepare('INSERT INTO products (catid, name, price, description) VALUES (?, ?, ?, ?)');
  insertPro.run(1, 'Smart Watch', 199.99, 'A smart watch with heart rate monitor');
  insertPro.run(1, 'Wireless Earbuds', 89.99, 'Noise cancelling wireless earbuds');
  insertPro.run(2, 'Cotton T-shirt', 29.99, '100% cotton casual T-shirt');
  insertPro.run(2, 'Leather Bag', 129.99, 'Genuine leather crossbody bag');
  insertPro.finalize();

  console.log('表创建+测试数据插入完成！');
});

module.exports = db; // 导出数据库连接，供其他文件调用