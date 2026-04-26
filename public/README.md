# Public Directory

## 概述

公共资源目录，存储前端静态文件，包括 HTML 页面、CSS 样式、JavaScript 脚本和图片资源。

---

## 目录结构

```
public/
├── cart/             # 购物车相关文件
├── category/         # 分类相关文件
├── css/              # 样式文件
├── images/           # 图片资源
├── js/               # JavaScript 脚本
├── products/         # 商品相关文件
├── change-password.html  # 修改密码页面
├── index.html        # 首页
├── login.html        # 登录页面
├── register.html     # 注册页面
└── user.html         # 用户中心页面
```

---

## 目录说明

### cart/
购物车相关文件。

**功能**：
- 购物车页面和相关资源

---

### category/
分类相关文件。

**功能**：
- 分类页面和相关资源

---

### css/
样式文件目录。

**文件**：
- `common.css` - 全局通用样式
- `custom.css` - 自定义样式
- `user.css` - 用户相关样式

---

### images/
图片资源目录。

**结构**：
- 按商品分类组织图片
- 包含商品主图和缩略图
- 支持多图片展示

---

### js/
JavaScript 脚本目录。

**核心模块**：
- `api/` - API 客户端（认证、商品、购物车、订单）
- `cart/` - 购物车功能
- `pages/` - 页面特定脚本
- `store/` - 状态管理
- `config.js` - 前端配置
- `utils.js` - 工具函数
- `script.js` - 主脚本

**API 模块**：
- `auth.js` - 认证相关 API
- `categories.js` - 分类 API
- `products.js` - 商品 API
- `cart.js` - 购物车 API
- `orders.js` - 订单 API

**状态管理**：
- `userStore.js` - 用户状态
- `cartStore.js` - 购物车状态
- `emitter.js` - 事件发射器

---

### products/
商品相关文件。

**功能**：
- 商品详情页面和相关资源

---

## HTML 页面

| 页面 | 功能 |
|------|------|
| index.html | 首页（商品展示、分类导航） |
| login.html | 登录页面 |
| register.html | 注册页面 |
| user.html | 用户中心（订单管理） |
| change-password.html | 修改密码页面 |

---

## 技术特点

1. **模块化**：按功能组织 JavaScript 代码
2. **API 封装**：统一的 API 客户端封装
3. **状态管理**：使用 store 模式管理应用状态
4. **响应式**：适配不同设备屏幕
5. **事件驱动**：使用事件发射器实现组件通信

---

## 注意事项

1. **图片路径**：所有图片路径使用相对路径，如 `/images/electronics/product.jpg`
2. **API 调用**：前端通过 `/api` 前缀调用后端接口
3. **安全性**：敏感操作需要登录验证
4. **性能优化**：图片使用适当尺寸，脚本按需加载
