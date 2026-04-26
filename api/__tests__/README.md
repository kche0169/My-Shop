# API Tests

## 概述

本目录包含后端 API 的单元测试和集成测试，使用 Jest + Supertest 框架。

## 测试文件说明

### 认证相关

| 文件 | 测试内容 |
|------|---------|
| `auth.test.js` | 基础登录功能测试 |
| `auth-comprehensive.test.js` | 完整认证流程测试（登录、登出、用户信息、密码修改） |

### 订单相关

| 文件 | 测试内容 |
|------|---------|
| `orders.test.js` | 订单创建、用户最近订单、PayPal回调 |
| `orders-digest.test.js` | 订单摘要(Salt/Digest)生成和一致性验证 |
| `orders-webhook.test.js` | Webhook摘要验证、篡改检测 |

### 业务模块

| 文件 | 测试内容 |
|------|---------|
| `cart.test.js` | 购物车API测试 |
| `products.test.js` | 商品列表和详情API测试 |
| `category.test.js` | 分类列表API测试 |

## 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- api/__tests__/orders.test.js

# 运行订单相关测试
npm test -- api/__tests__/orders
```

## 测试覆盖的场景

### 订单创建 (orders.test.js)
- 正常创建订单
- 无效用户ID验证
- 空购物车验证
- 商品数量验证
- 混合有效/无效商品处理
- 未登录拒绝访问
- 最近5条订单限制
- PayPal支付成功回调

### 摘要验证 (orders-digest.test.js + orders-webhook.test.js)
- Salt生成唯一性
- Digest生成一致性
- 不同参数产生不同Digest
- 价格篡改检测
- 商品数量篡改检测
- 商品ID篡改检测
- 商户邮箱篡改检测
- 货币篡改检测
- 添加/删除商品检测
