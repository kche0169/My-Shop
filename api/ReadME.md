```
api/
├── middlewares/
│   └── auth.js           ✅ 保安代码
├── routes/
│   └── category.js       ✅ 网址代码
├── controllers/
│   └── category/
│       ├── getAll.js     ✅ 只查分类
│       ├── add.js        ✅ 只加分类
│       ├── edit.js       ✅ 只改分类
│       └── delete.js     ✅ 只删分类
```
```
api/
├── middlewares/
│   └── auth.js           ✅ 复用！管理员保安（不用改，直接用）
├── routes/
│   ├── category.js       ✅ 旧的
│   └── orders.js         ✅ 订单路由（仅网址+中间件）
├── controllers/
│   ├── category/         ✅ 旧的
│   └── order/            ✅ 订单控制器（每个接口独立文件）
│       ├── utils.js      ✅ 订单通用工具函数
│       ├── create.js     ✅ 创建订单
│       ├── webhook.js    ✅ PayPal回调
│       ├── success.js    ✅ 支付成功跳转
│       ├── adminAll.js   ✅ 管理员查所有订单
│       └── userRecent.js ✅ 用户查最近订单
```