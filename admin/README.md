# Admin Panel

## 概述

管理员控制面板，用于管理分类、产品和查看订单。

## 文件结构

| 文件 | 说明 |
|------|------|
| `index.html` | 管理员主页面（分类/产品管理） |
| `orders.html` | 管理员订单页面 |
| `admin.js` | 核心业务逻辑 |
| `admin.css` | 样式文件 |

## API 接口一览

### 分类管理 API

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/api/cate/all` | GET | - | 获取所有分类列表 |
| `/api/cate/add` | POST | `{ name }` | 新增分类 |
| `/api/cate/edit` | POST | `{ catid, name }` | 修改分类 |
| `/api/cate/del/:catid` | GET | URL参数 | 删除分类（含关联产品和图片） |

### 产品管理 API

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/api/products/list` | GET | - | 获取所有产品列表 |
| `/api/products/add` | POST | FormData: catid, name, price, description, proImg | 新增产品（支持图片上传≤10MB） |
| `/api/products/edit` | POST | FormData: pid, catid, name, price, description, proImg | 修改产品 |
| `/api/products/del/:pid` | GET | URL参数 | 删除产品（含服务器图片清理） |

### 订单管理 API

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/api/orders/admin/all` | GET | - | 获取所有订单（需管理员权限） |

### 认证 API

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/api/logout` | GET | - | 登出（清除Cookie） |

## 核心函数 (admin.js)

### 分类管理

| 函数 | 说明 |
|------|------|
| `getCateList()` | 获取并渲染分类列表和下拉框 |
| `editCate(catid, name)` | 将分类信息填充到编辑表单 |
| `delCate(catid)` | 删除分类（需确认，级联删除关联内容） |

### 产品管理

| 函数 | 说明 |
|------|------|
| `getProList()` | 获取并渲染产品列表（含图片路径处理） |
| `editPro(pid, catid, name, price, description)` | 将产品信息填充到编辑表单 |
| `delPro(pid)` | 删除产品（需确认，清理服务器图片） |

### 页面导航

| 函数 | 说明 |
|------|------|
| `loadOrders()` | 加载并渲染所有订单 |

## 使用说明

### 访问页面
- 管理员首页：`/admin/index.html`
- 管理员订单页：`/admin/orders.html`

### 分类管理流程
1. 页面加载时自动获取分类列表
2. 使用表单新增分类
3. 点击"修改"按钮 → 填充表单 → 提交保存
4. 点击"删除"按钮 → 确认后删除（含级联删除）

### 产品管理流程
1. 选择分类 → 输入名称/价格/描述 → 上传图片 → 提交
2. 点击"修改"按钮 → 填充表单 → 可选择性更换图片 → 保存
3. 点击"删除"按钮 → 确认后删除（含服务器图片清理）

### 图片要求
- 格式：`jpg`, `jpeg`, `png`
- 大小：≤ 10MB

## 注意事项

1. 删除分类会同时删除关联的所有产品和服务器图片
2. 删除产品会同时删除服务器上的原图和缩略图
3. 订单页面需要有效的管理员会话才能访问
