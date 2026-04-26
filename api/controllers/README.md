# API Controllers

## 概述

后端控制器层，处理业务逻辑。

## 目录结构

```
api/controllers/
├── category/          # 分类管理
├── product/           # 产品管理
│   └── cart/          # 购物车
└── order/             # 订单管理
```

---

## category/ 分类管理

### getAll.js
获取所有分类列表。

```javascript
const getAllCategories = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| 无 | `{ code: 0, data: [{catid, name}, ...] }` |

**行为**：查询 `categories` 表，按 `catid` 升序返回所有分类。

---

### add.js
新增分类。

```javascript
const addCategory = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| `{ name }` | `{ code: 0, msg: 'Category added successfully' }` |

**行为**：
- 验证分类名不能为空
- 插入数据库（`INSERT OR IGNORE` 防止重复）
- 已存在返回 `code: -1`

---

### edit.js
修改分类。

```javascript
const editCategory = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| `{ catid, name }` | `{ code: 0, msg: 'Category edited successfully' }` |

**行为**：
- 验证分类ID和名称
- 更新数据库记录
- 不存在返回 `code: -1`

---

### delete.js
删除分类（级联删除）。

```javascript
const deleteCategory = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| URL参数 `catid` | `{ code: 0, msg: 'Category deleted successfully...' }` |

**行为**：
1. 查询该分类下所有产品
2. 删除每个产品的服务器图片（origin.jpg, thumb.jpg）
3. 删除 `products` 表中该分类的所有产品
4. 删除 `categories` 表中的分类
5. 无产品时直接删除分类

---

## product/ 产品管理

### list.js
获取产品列表。

```javascript
const getProductList = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| Query: `catid`（可选） | `{ code: 0, data: [{pid, name, price, ...}, ...] }` |

**行为**：
- 无 `catid` → 返回所有产品
- 有 `catid` → 返回该分类下的产品
- 关联查询分类名称（`cateName`）

---

### detail.js
获取产品详情。

```javascript
const getProductDetail = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| Query: `pid` | `{ code: 0, data: {product details} }` |

**行为**：
- 验证 `pid` 必须为正整数
- 不存在返回 404

---

### add.js
新增产品。

```javascript
const addProduct = async (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| FormData: `catid, name, price, description, proImg` | `{ code: 0, msg: '商品添加成功', data: { pid } }` |

**行为**：
1. 验证输入参数
2. 插入产品记录（初始 `img_path` 为空）
3. 如果有图片，调用 `handleImageUpload` 处理并更新 `img_path`
4. 图片保存到 `/public/images/{category}/{pid}/origin.jpg` 和 `thumb.jpg`

---

### edit.js
修改产品。

```javascript
const editProduct = async (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| FormData: `pid, catid, name, price, description, proImg` | `{ code: 0, msg: '商品编辑成功' }` |

**行为**：
1. 验证参数
2. 更新产品信息
3. 如果有新图片：
   - 删除旧图片（如果存在）
   - 保存新图片到相同目录
4. 产品不存在返回 404

---

### delete.js
删除产品。

```javascript
const deleteProduct = async (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| URL参数 `pid` | `{ code: 0, msg: '商品删除成功' }` |

**行为**：
1. 查询产品所属分类
2. 删除服务器上的整个产品目录（包含所有图片）
3. 删除数据库记录
4. 不存在返回 404

---

### uploads.js
图片上传处理工具。

```javascript
const { getCategoryName, handleImageUpload, UPLOAD_ROOT } = require('./uploads');
```

| 函数 | 说明 |
|------|------|
| `getCategoryName(catid)` | 映射分类ID到目录名：1→electronics, 2→fashion, 3→home, 4→sports |
| `handleImageUpload(pid, catid, fileBuffer)` | 处理图片：生成 origin.jpg 和 300x300 thumb.jpg |
| `UPLOAD_ROOT` | 上传根目录 `/public/images` |

**图片保存路径**：
```
/public/images/{category}/{pid}/origin.jpg
/public/images/{category}/{pid}/thumb.jpg
```

**前端访问路径**：`/images/{category}/{pid}/thumb.jpg`

---

## product/cart/ 购物车

所有购物车接口都需要 `userid` 参数。

### list.js
获取用户购物车列表。

```javascript
const cartList = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| `{ userid }` | `{ code: 0, data: [{cartId, pid, num, name, price, img_path}, ...] }` |

---

### add.js
加入购物车。

```javascript
const cartAdd = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| `{ userid, pid, num }` | `{ code: 0, msg: '加入购物车成功', data: { cartId } }` |

**行为**：
- 验证商品存在
- 插入购物车记录

---

### update.js
更新购物车商品数量。

```javascript
const cartUpdate = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| `{ userid, pid, num }` | `{ code: 0, msg: '更新成功' }` |

**行为**：
- 更新指定用户指定商品的数量
- 商品不存在返回 404

---

### delete.js
删除购物车商品。

```javascript
const cartDelete = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| `{ userid, pid }` | `{ code: 0, msg: '删除成功' }` |

---

### clear.js
清空用户购物车。

```javascript
const cartClear = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| `{ userid }` | `{ code: 0, msg: '清空购物车成功' }` |

---

## order/ 订单管理

### create.js
创建订单。

```javascript
const createOrder = async (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| `{ userid, items: [{pid, num}, ...] }` | `{ code: 0, data: { orderId, paypalOrderId, approvalLink } }` |

**行为**：
1. 验证商品有效性（跳过无效商品）
2. 计算总价
3. 生成 Salt 和 Digest（用于支付验证）
4. 调用 PayPal API 创建订单
5. 存入数据库（状态 PENDING）
6. 返回 PayPal 支付链接

**Digest 生成规则**：
```
sha256(currency|merchantEmail|salt|itemsString|totalPrice)
itemsString = pid|num|price|...
```

---

### userRecent.js
获取用户最近5条订单。

```javascript
const userGetRecentOrders = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| Cookie: `user` | `{ code: 0, data: [orders...] }` |

**行为**：
- 通过 Cookie 获取当前用户 session
- 查询该用户最近5条订单（按创建时间倒序）
- 未登录返回 401

---

### adminAll.js
获取所有订单（管理员）。

```javascript
const adminGetAllOrders = (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| 无（需管理员权限） | `{ code: 0, data: [all orders...] }` |

---

### webhook.js
PayPal 支付回调验证。

```javascript
const orderWebhook = async (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| PayPal POST Body (JSON) | `200` / `400` / `500` |

**行为**：
1. 解析 PayPal 事件
2. 只处理 `CHECKOUT.ORDER.APPROVED` 或 `PAYMENT.CAPTURE.COMPLETED`
3. 查询本地订单
4. 验证 Digest（防止数据篡改）
5. 更新订单状态为 `PAID`
6. 已支付订单直接返回 200

**Digest 验证逻辑**：
- 用数据库中存储的 `salt`、`items`、`total_price` 重新计算 Digest
- 与存储的 `digest` 比较，不匹配返回 400

---

### success.js
PayPal 支付成功回调。

```javascript
const paySuccess = async (req, res) => { ... }
```

| 输入 | 输出 |
|------|------|
| Query: `token` (PayPal Order ID) | 重定向到 `/index.html` |

**行为**：
- 使用 token 查询对应订单
- 更新订单状态为 `PAID`
- 重定向到首页

---

### utils.js
订单工具函数。

```javascript
const { generateSalt, generateDigest, createPayPalOrder } = require('./utils');
```

| 函数 | 说明 |
|------|------|
| `generateSalt(length=16)` | 生成随机盐（32字符hex） |
| `generateDigest({currency, merchantEmail, salt, items, totalPrice})` | 生成 SHA256 摘要 |
| `createPayPalOrder(totalPrice, currency)` | 调用 PayPal API 创建订单 |

---

## 通用响应格式

```javascript
// 成功
{ code: 0, msg: '...', data: {...} }

// 失败
{ code: -1, msg: '错误信息' }

// HTTP 状态码
200 - 成功
400 - 参数错误
401 - 未登录
404 - 资源不存在
500 - 服务器错误
```
