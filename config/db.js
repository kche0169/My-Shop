const sqlite3 = require('sqlite3').verbose();

// 数据库连接
const db = new sqlite3.Database('./shop.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) console.error('[ERROR] Database connection failed:', err.message);
  else console.log('[SUCCESS] SQLite database connected successfully!');
});

module.exports = db;