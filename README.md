# IEMS5718

```
your-shopping-website/
├── index.html          # main page
├── category/           # category page
│   ├── category1.html
│   └── category2.html
├── products/           # product page
│   ├── product1.html
│   └── product2.html
├── css/
│   └── style.css       # css file
├── images/             # image source
│   ├── thumbnails/      
│   └── full-size/       
└── README.md           
```
```
IEMS5718/
├── db/                # 数据库目录
│   └── conn.js        # 后端JS：数据库连接（根目录/db/下）
├── admin/             # 管理员面板（前端HTML+JS）
│   └── index.html     # 管理员主页面
├── api/               # 后端接口目录
│   ├── categoryApi.js # 分类接口
│   └── productApi.js  # 产品接口
├── uploads/           # 产品图片存储目录
├── js/                # 前端JS（浏览器运行，原有的）
│   ├── script.js
│   └── script1.js
├── css/               # 前端样式（原有的）
├── category/          # 原有的分类页面
├── products/          # 原有的产品详情页
├── images/            # 原有的静态图片（可保留，新图存uploads）
├── index.html         # 前端主页面（原有的，后续改造）
├── README.md
├── package.json       # Node项目配置（npm init生成）
├── package-lock.json
├── node_modules/      # npm安装的依赖（已.gitignore）
└── app.js             # 后端JS：Node服务入口（根目录）
```