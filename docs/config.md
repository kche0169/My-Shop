# 服务器部署 

## 1. Nginx 服务
**核心定位**：项目入口网关（负责 HTTPS 加密、域名访问，必须优先启动）
**端口号**：443 (HTTPS)、80
**项目路径**：系统服务，无项目目录
```bash
# 启动
sudo systemctl start nginx
# 停止
sudo systemctl stop nginx
# 查看运行状态
systemctl status nginx
# 设置开机自启
sudo systemctl enable nginx
```

---

## 2. Apache 服务
**核心定位**：反向代理（转发请求给后端项目，与 Nginx 共存）
**端口号**：8080（已修改，避免端口冲突）
**项目路径**：系统服务，无项目目录
```bash
# 启动
sudo systemctl start apache2
# 停止
sudo systemctl stop apache2
# 查看运行状态
systemctl status apache2
# 设置开机自启
sudo systemctl enable apache2
```

---

## 3. 后端项目主程序 (Node.js)
**核心定位**：项目业务逻辑（监听端口，解决 503 报错核心）
**端口号**：3000
**项目根目录**：`~/work/IEMS5718`
```bash
# 进入目录
cd ~/work/IEMS5718

# 【前台启动】终端窗口保持打开（测试用）
node app.js

# 【后台启动】关闭终端不停止（生产推荐）
nohup node app.js > app.log 2>&1 &
```

---

## 4. 数据库连接服务 (Node.js)
**核心定位**：项目数据库连接依赖（必须在主程序前启动）
**端口号**：无独立端口
**项目根目录**：`~/work/IEMS5718`
```bash
# 进入目录
cd ~/work/IEMS5718

# 【前台启动】终端窗口保持打开（测试用）
node db/conn.js

# 【后台启动】关闭终端不停止（生产推荐）
nohup node db/conn.js > db.log 2>&1 &
```

---

# 核心部署架构（必看）
用户访问 → **Nginx(443 HTTPS)** → **Apache(8080 代理)** → **项目(3000 端口)** → **数据库连接**

---

# 一键启动所有服务（终极命令）
服务器重启/服务挂了后，直接复制执行，一键恢复：
```bash
# 1. 启动网关
sudo systemctl start nginx
# 2. 启动代理
sudo systemctl start apache2
# 3. 进入项目
cd ~/work/IEMS5718
# 4. 后台启动数据库连接
nohup node db/conn.js > db.log 2>&1 &
# 5. 后台启动项目主程序
nohup node app > app.log 2>&1 &
```

---

# 常用排查命令
```bash
# 查看3000端口项目是否运行
sudo lsof -i :3000
# 查看Apache错误日志
sudo tail -f /var/log/apache2/error.log
```