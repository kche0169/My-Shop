# API 架构文档

## 目录结构

```
api/
├── middlewares/             # 【API 专用保安】全模块复用
│   └── auth.js              ✅ 管理员鉴权（分类/商品/订单共用）
│
├── routes/                  # 【所有接口路由】只定义网址，不干活
│   ├── category.js          ✅ 分类接口路由
│   ├── products.js          ✅ 商品+购物车接口路由
│   └── orders.js            ✅ 订单接口路由
│
└── controllers/             # 【所有干活逻辑】一个功能一个文件
    ├── category/            # 分类模块控制器
    │   ├── getAll.js        ✅ 查询所有分类
    │   ├── add.js           ✅ 添加分类
    │   ├── edit.js          ✅ 编辑分类
    │   └── delete.js        ✅ 删除分类（级联删除产品+图片）
    │
    ├── product/             # 商品模块控制器（含图片+购物车）
    │   ├── uploads.js       ✅ 图片上传工具（生成origin/thumb）
    │   ├── list.js          ✅ 商品列表（支持分类筛选）
    │   ├── detail.js        ✅ 商品详情
    │   ├── add.js           ✅ 添加商品
    │   ├── edit.js          ✅ 编辑商品
    │   ├── delete.js        ✅ 删除商品（清理图片目录）
    │   └── cart/            # 购物车子模块
    │       ├── add.js       ✅ 加入购物车
    │       ├── list.js      ✅ 购物车列表
    │       ├── update.js    ✅ 更新数量
    │       ├── delete.js    ✅ 删除商品
    │       └── clear.js     ✅ 清空购物车
    │
    └── order/               # 订单模块控制器
        ├── utils.js         ✅ 订单工具（Salt/Digest生成/PayPal）
        ├── create.js        ✅ 创建订单
        ├── webhook.js       ✅ PayPal 回调验证
        ├── success.js       ✅ 支付成功跳转
        ├── adminAll.js      ✅ 管理员查询所有订单
        └── userRecent.js    ✅ 用户查询最近5条订单
```

---

## 模块说明

### middlewares/
**中间件层**，处理全局认证和权限控制。

| 文件 | 功能 |
|------|------|
| auth.js | 管理员权限验证，检查 session 和 admin 标志 |

### routes/
**路由层**，定义 API 端点，配置中间件和参数验证。

| 文件 | 功能 |
|------|------|
| category.js | 分类 CRUD 路由（4个端点） |
| products.js | 商品+购物车路由（10个端点） |
| orders.js | 订单路由（5个端点，含 webhook） |

### controllers/
**控制器层**，处理具体业务逻辑。

#### category/
| 文件 | 功能 |
|------|------|
| getAll.js | 获取所有分类列表 |
| add.js | 新增分类（防重复） |
| edit.js | 修改分类名称 |
| delete.js | 删除分类（级联删除关联产品和服务器图片） |

#### product/
| 文件 | 功能 |
|------|------|
| uploads.js | 图片处理：压缩生成 origin.jpg 和 300x300 thumb.jpg |
| list.js | 商品列表（按分类筛选，返回分类名） |
| detail.js | 商品详情（单个商品信息） |
| add.js | 新增商品（支持图片上传） |
| edit.js | 编辑商品（可选替换图片） |
| delete.js | 删除商品（清理图片目录） |

#### product/cart/
| 文件 | 功能 |
|------|------|
| add.js | 加入购物车（验证商品存在） |
| list.js | 获取用户购物车列表 |
| update.js | 更新商品数量 |
| delete.js | 删除购物车商品 |
| clear.js | 清空用户购物车 |

#### order/
| 文件 | 功能 |
|------|------|
| utils.js | Salt生成、Digest加密、PayPal API调用 |
| create.js | 创建订单（验证商品、生成摘要、调用PayPal） |
| webhook.js | PayPal回调（验证签名、更新状态） |
| success.js | 支付成功回调（更新状态、重定向） |
| adminAll.js | 管理员获取所有订单 |
| userRecent.js | 用户获取最近5条订单 |

---

## 架构特点

1. **分层清晰**：middlewares → routes → controllers
2. **单一职责**：每个文件只做一件事
3. **中间件复用**：`requireAdmin` 通用于所有管理操作
4. **参数验证**：使用 express-validator 进行输入校验
5. **安全机制**：Digest 摘要防止订单数据篡改
