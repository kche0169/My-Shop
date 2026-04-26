# Configuration Files

## 概述

配置文件目录，存储应用程序的全局配置。

---

## 文件说明

### db.js
数据库连接配置。

```javascript
const db = new sqlite3.Database('./shop.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) console.error('[ERROR] Database connection failed:', err.message);
  else console.log('[SUCCESS] SQLite database connected successfully!');
});
```

**功能**：
- 连接到项目根目录的 `shop.db` SQLite 数据库
- 自动创建数据库文件（如果不存在）
- 提供数据库连接实例给其他模块使用

**使用方式**：
```javascript
const db = require('./config/db');
```

---

### paypal.js
PayPal 支付配置。

```javascript
module.exports = {
  clientId: 'ASPmvGRmJd7OxtS-y1MYVflVAjV-58p7iwZFL6FzpVGmiGPlst8lyR-X4CtdLdfCk-xXCKuFQm3HzQAx',
  clientSecret: 'EGxXL8U-i54fKfctvqyZbz76CobiZ3yHElfYkxlCwRDUa_xHQP5zJ_zy3JlehYCEk2QXfWaEtYUeQ_YU',
  merchantEmail: 'sb-uenhw50765510@business.example.com',
  currency: 'USD',
  mode: 'sandbox' 
};
```

**配置项**：
- `clientId` - PayPal 应用客户端 ID
- `clientSecret` - PayPal 应用客户端密钥
- `merchantEmail` - 商家邮箱（用于支付通知）
- `currency` - 货币类型（默认 USD）
- `mode` - 环境模式（sandbox 沙箱 / live 生产）

**使用方式**：
```javascript
const paypalConfig = require('./config/paypal');
```

---

## 注意事项

1. **PayPal 配置**：当前使用的是沙箱环境，生产环境需要替换为真实的 PayPal 凭证
2. **数据库路径**：`shop.db` 存储在项目根目录，会自动创建
3. **安全性**：生产环境中，PayPal 密钥应该使用环境变量或加密存储
