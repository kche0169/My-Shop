# API Routes

## 概述

路由层，定义 API 端点和中间件配置。

---

## category.js
分类管理路由。

### API 端点

| 方法 | 路径 | 中间件 | 说明 |
|------|------|--------|------|
| GET | `/api/cate/all` | - | 获取所有分类 |
| POST | `/api/cate/add` | `requireAdmin` + 验证 | 新增分类 |
| POST | `/api/cate/edit` | `requireAdmin` + 验证 | 修改分类 |
| GET | `/api/cate/del/:catid` | `requireAdmin` | 删除分类 |

**验证规则**：
- `add`: `name` 不能为空
- `edit`: `name` 不能为空，`catid` 必须为数字

---

## products.js
商品和购物车管理路由。

### 商品 API

| 方法 | 路径 | 中间件 | 说明 |
|------|------|--------|------|
| GET | `/api/products/list` | - | 获取商品列表 |
| GET | `/api/products/detail` | - | 获取商品详情 |
| POST | `/api/products/add` | `requireAdmin` + `multer` | 新增商品 |
| POST | `/api/products/edit` | `requireAdmin` + `multer` | 修改商品 |
| GET | `/api/products/del/:pid` | `requireAdmin` + 验证 | 删除商品 |

**文件上传配置**：
- 字段名：`proImg`
- 大小限制：10MB
- 支持格式：`jpg`, `jpeg`, `png`

**验证规则**：
- `del`: `pid` 必须为数字

### 购物车 API

| 方法 | 路径 | 验证 | 说明 |
|------|------|------|------|
| POST | `/api/products/cart/list` | `userid` 数字 | 获取购物车列表 |
| POST | `/api/products/cart/add` | `userid`, `pid`, `num` 数字 | 加入购物车 |
| POST | `/api/products/cart/update` | `userid`, `pid`, `num` 数字 | 更新数量 |
| POST | `/api/products/cart/delete` | `userid`, `pid` 数字 | 删除商品 |
| POST | `/api/products/cart/clear` | `userid` 数字 | 清空购物车 |

---

## orders.js
订单管理路由。

### API 端点

| 方法 | 路径 | 中间件 | 说明 |
|------|------|--------|------|
| POST | `/api/orders/create` | 验证 | 创建订单 |
| POST | `/api/orders/webhook` | `express.raw` | PayPal 回调 |
| GET | `/api/orders/paypal/success` | - | 支付成功回调 |
| GET | `/api/orders/admin/all` | `requireAdmin` | 获取所有订单 |
| GET | `/api/orders/user/recent` | - | 获取用户最近订单 |

**验证规则**：
- `create`: `userid` >= 1，`items` 为非空数组

**Webhook 配置**：
```javascript
express.raw({ type: 'application/json' })
```
PayPal webhook 需要原始 body 进行签名验证。

---

## 路由前缀

所有路由通过 `app.js` 挂载时添加前缀：

```javascript
app.use('/api/cate', cateApi);      // → /api/cate/*
app.use('/api/products', productsApi); // → /api/products/*
app.use('/api/orders', ordersApi);    // → /api/orders/*
```

---

## 中间件顺序

典型路由配置示例：

```javascript
router.post('/edit', requireAdmin, upload, editProduct);
```

**执行顺序**：Cookie解析 → session验证 → 管理员验证 → 文件上传 → 业务逻辑
