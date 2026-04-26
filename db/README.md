# Database Structure

## 概述

数据库配置和初始化目录，负责创建表结构和初始化测试数据。

---

## 文件说明

### conn.js
数据库连接与初始化脚本。

**功能**：
- 连接到项目根目录的 `shop.db` SQLite 数据库
- 创建数据库表结构
- 初始化测试数据（用户、分类、商品）
- 提供密码哈希功能

---

## 表结构

### users 表
用户认证表。

| 字段 | 类型 | 描述 |
|------|------|------|
| userid | INTEGER | 自增主键 |
| email | TEXT | 邮箱（唯一） |
| password | TEXT | 密码哈希值 |
| admin | INTEGER | 权限（0=普通用户, 1=管理员） |
| created_at | DATETIME | 创建时间 |

**初始数据**：
- 管理员：admin@shop.com (密码: Admin123!)
- 普通用户：user@shop.com (密码: User123!)

---

### categories 表
商品分类表。

| 字段 | 类型 | 描述 |
|------|------|------|
| catid | INTEGER | 自增主键 |
| name | TEXT | 分类名称（唯一） |

**初始数据**：
- Electronics
- Fashion
- Home
- Sports

---

### products 表
商品信息表。

| 字段 | 类型 | 描述 |
|------|------|------|
| pid | INTEGER | 自增主键 |
| catid | INTEGER | 分类ID（外键） |
| name | TEXT | 商品名称 |
| price | REAL | 价格 |
| description | TEXT | 简短描述 |
| long_description | TEXT | 详细描述 |
| img_path | TEXT | 主图片路径 |
| img_path2 | TEXT | 第二张图片路径 |
| img_path3 | TEXT | 第三张图片路径 |
| img_path4 | TEXT | 第四张图片路径 |

**初始数据**：
- 每个分类包含多个商品，带有多图片和详细描述

---

### orders 表
订单表。

| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 自增主键 |
| userid | INTEGER | 用户ID |
| paypal_order_id | TEXT | PayPal 订单ID（唯一） |
| items_json | TEXT | 订单商品JSON [{pid, num, price}] |
| total_price | REAL | 订单总价 |
| currency | TEXT | 货币类型 |
| digest | TEXT | 订单摘要（防篡改） |
| status | TEXT | 订单状态（PENDING/PAID/FAILED/CANCELLED） |
| merchant_email | TEXT | 商家邮箱 |
| salt | TEXT | 随机盐值（生成摘要） |
| created_at | DATETIME | 创建时间 |
| paid_at | DATETIME | 支付时间 |
| paypal_transaction_id | TEXT | PayPal 交易ID |

---

### cart 表
购物车表。

| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 自增主键 |
| userid | INTEGER | 用户ID |
| pid | INTEGER | 商品ID |
| num | INTEGER | 数量 |
| UNIQUE | - | (userid, pid) 唯一约束 |

---

## 注意事项

1. **数据库路径**：`shop.db` 存储在项目根目录
2. **测试数据**：每次启动应用会自动创建表并初始化测试数据
3. **密码安全**：使用 pbkdf2Sync 进行密码哈希处理
4. **外键关系**：products.catid 引用 categories.catid
