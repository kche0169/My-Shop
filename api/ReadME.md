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
    │   └── delete.js        ✅ 删除分类
    │
    ├── product/             # 商品模块控制器（含图片+购物车）
    │   ├── upload.js        ✅ 图片上传工具（全局复用）
    │   ├── list.js          ✅ 商品列表
    │   ├── detail.js        ✅ 商品详情
    │   ├── add.js           ✅ 添加商品
    │   ├── edit.js          ✅ 编辑商品
    │   ├── delete.js        ✅ 删除商品
    │   └── cart/            ✅ 购物车子模块
    │       ├── add.js
    │       ├── list.js
    │       ├── update.js
    │       ├── delete.js
    │       └── clear.js
    │
    └── order/               # 订单模块控制器
        ├── utils.js         ✅ 订单通用工具（加密/PayPal）
        ├── create.js        ✅ 创建订单
        ├── webhook.js       ✅ PayPal 支付回调
        ├── success.js       ✅ 支付成功跳转
        ├── adminAll.js      ✅ 管理员查询所有订单
        └── userRecent.js    ✅ 用户查询最近订单
```