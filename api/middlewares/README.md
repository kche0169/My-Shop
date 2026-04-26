# API Middlewares

## 概述

中间件目录，存储 API 专用的认证和权限控制组件。

---

## 文件说明

### auth.js
管理员权限验证中间件。

**功能**：
- 验证用户是否登录
- 验证用户是否为管理员
- 阻止未授权访问管理接口

**代码结构**：
```javascript
const requireAdmin = (req, res, next) => {
  // 检查 session 是否存在
  // 检查 admin 标志是否为 1
  // 验证通过则继续，否则返回 401 错误
};

module.exports = { requireAdmin };
```

**使用方式**：
```javascript
const { requireAdmin } = require('../middlewares/auth');

// 在路由中使用
router.post('/edit', requireAdmin, editProduct);
```

---

## 中间件列表

| 中间件 | 功能 | 适用场景 |
|--------|------|----------|
| requireAdmin | 管理员权限验证 | 分类、商品、订单的管理操作 |

---

## 验证流程

1. 检查 `req.session.userid` 是否存在（用户是否登录）
2. 检查 `req.session.admin` 是否为 1（是否为管理员）
3. 验证通过：调用 `next()` 继续处理请求
4. 验证失败：返回 401 状态码和错误信息

---

## 注意事项

1. **依赖会话**：需要在应用中启用 session 中间件
2. **使用范围**：仅适用于需要管理员权限的 API 接口
3. **错误处理**：验证失败会返回 401 Unauthorized 响应
