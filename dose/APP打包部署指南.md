# GitNetDisk APP 打包部署指南

## 方案概述

我们将使用以下技术栈打包应用：

### Web 端
- **静态网站部署**：将前端打包为静态文件
- **后端部署**：部署 Go 后端服务

### 移动端
- **方案 1**：PWA（渐进式 Web 应用）- 推荐，最简单
- **方案 2**：Capacitor - 打包成原生 APP

## 一、Web 端部署

### 1.1 前端打包

#### 步骤 1：配置生产环境

编辑 `git-web/.env.production`（新建文件）：
```env
VITE_API_URL=https://your-backend-domain.com
```

#### 步骤 2：构建前端
```bash
cd git-web
npm run build
```

这会在 `git-web/dist` 目录生成静态文件。

#### 步骤 3：部署前端

**选项 A：Vercel（推荐，免费）**
```bash
npm install -g vercel
cd git-web
vercel
```

**选项 B：Netlify（免费）**
1. 访问 https://netlify.com
2. 拖拽 `dist` 文件夹上传
3. 完成！

**选项 C：自己的服务器（Nginx）**
```bash
# 上传 dist 文件夹到服务器
scp -r dist/* user@server:/var/www/gitnetdisk/

# Nginx 配置
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/gitnetdisk;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 1.2 后端部署

#### 步骤 1：编译后端
```bash
cd git-net-disk

# Windows
go build -o gitnetdisk.exe main.go

# Linux/Mac
GOOS=linux GOARCH=amd64 go build -o gitnetdisk main.go
```

#### 步骤 2：部署到服务器

**使用 Docker（推荐）**

创建 `git-net-disk/Dockerfile`：
```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o gitnetdisk main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/gitnetdisk .
EXPOSE 3000
CMD ["./gitnetdisk"]
```

创建 `git-net-disk/docker-compose.yml`：
```yaml
version: '3.8'
services:
  gitnetdisk-backend:
    build: .
    ports:
      - "3000:3000"
    restart: always
    environment:
      - GIN_MODE=release
```

部署：
```bash
docker-compose up -d
```

**直接运行**
```bash
# 上传到服务器
scp gitnetdisk user@server:/opt/gitnetdisk/

# SSH 到服务器
ssh user@server

# 运行
cd /opt/gitnetdisk
nohup ./gitnetdisk > gitnetdisk.log 2>&1 &
```

## 二、PWA（渐进式 Web 应用）- 推荐

PWA 可以让用户"安装"你的网站到手机桌面，像原生 APP 一样使用。

### 2.1 配置 PWA

#### 步骤 1：安装 Vite PWA 插件
```bash
cd git-web
npm install -D vite-plugin-pwa
```

#### 步骤 2：更新 `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'GitNetDisk',
        short_name: 'GitNetDisk',
        description: '您的 GitHub 私有云盘',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  server: {
    port: 5173
  }
})
```

#### 步骤 3：创建图标

在 `git-web/public/` 目录创建：
- `pwa-192x192.png` (192x192 像素)
- `pwa-512x512.png` (512x512 像素)
- `apple-touch-icon.png` (180x180 像素)

#### 步骤 4：重新构建
```bash
npm run build
```

#### 步骤 5：部署

部署到 HTTPS 网站（PWA 需要 HTTPS）。

### 2.2 使用 PWA

**在手机上**：
1. 用浏览器打开你的网站
2. 浏览器会提示"添加到主屏幕"
3. 点击添加
4. 现在可以像原生 APP 一样使用了！

**优点**：
- ✅ 无需应用商店审核
- ✅ 自动更新
- ✅ 跨平台（iOS、Android）
- ✅ 开发简单

## 三、原生 APP（Capacitor）

如果需要更多原生功能或上架应用商店，使用 Capacitor。

### 3.1 安装 Capacitor

```bash
cd git-web
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npx cap init
```

配置信息：
- App name: `GitNetDisk`
- App ID: `com.yourcompany.gitnetdisk`
- Web directory: `dist`

### 3.2 配置 Capacitor

编辑 `capacitor.config.ts`：
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.gitnetdisk',
  appName: 'GitNetDisk',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // 开发时使用本地后端
    // url: 'http://10.0.2.2:3000',
    // cleartext: true
  }
};

export default config;
```

### 3.3 构建并添加平台

```bash
# 构建前端
npm run build

# 添加 Android
npx cap add android

# 添加 iOS（需要 Mac）
npx cap add ios

# 同步文件
npx cap sync
```

### 3.4 打包 Android APP

#### 步骤 1：安装 Android Studio
下载：https://developer.android.com/studio

#### 步骤 2：打开项目
```bash
npx cap open android
```

#### 步骤 3：在 Android Studio 中
1. 等待 Gradle 同步完成
2. 点击 `Build` → `Generate Signed Bundle / APK`
3. 选择 `APK`
4. 创建或选择签名密钥
5. 选择 `release` 构建类型
6. 点击 `Finish`

生成的 APK 在：`android/app/build/outputs/apk/release/`

### 3.5 打包 iOS APP（需要 Mac）

#### 步骤 1：打开 Xcode
```bash
npx cap open ios
```

#### 步骤 2：在 Xcode 中
1. 选择开发团队
2. 配置 Bundle Identifier
3. 连接 iPhone 或选择模拟器
4. 点击 Run 按钮

#### 步骤 3：发布到 App Store
1. `Product` → `Archive`
2. 上传到 App Store Connect
3. 提交审核

## 四、后端部署方案

### 4.1 云服务器部署

**推荐服务商**：
- 阿里云
- 腾讯云
- AWS
- DigitalOcean

**部署步骤**：
1. 购买服务器（1核2G 即可）
2. 安装 Docker
3. 上传代码
4. 运行 `docker-compose up -d`
5. 配置域名和 SSL 证书

### 4.2 Serverless 部署

**使用 Railway（推荐，简单）**：
1. 访问 https://railway.app
2. 连接 GitHub 仓库
3. 选择 `git-net-disk` 目录
4. 自动部署！

**使用 Render**：
1. 访问 https://render.com
2. 创建 Web Service
3. 连接 GitHub
4. 构建命令：`go build -o gitnetdisk main.go`
5. 启动命令：`./gitnetdisk`

## 五、完整部署流程

### 5.1 快速部署（推荐）

**前端 + PWA**：
```bash
# 1. 配置 PWA
cd git-web
npm install -D vite-plugin-pwa
# 更新 vite.config.ts（见上文）

# 2. 构建
npm run build

# 3. 部署到 Vercel
npm install -g vercel
vercel
```

**后端**：
```bash
# 1. 部署到 Railway
# 访问 railway.app，连接 GitHub，选择仓库

# 2. 或使用 Docker
cd git-net-disk
docker build -t gitnetdisk .
docker run -d -p 3000:3000 gitnetdisk
```

### 5.2 生产环境配置

#### 前端环境变量
创建 `git-web/.env.production`：
```env
VITE_API_URL=https://api.your-domain.com
```

#### 后端环境变量
```bash
export GIN_MODE=release
export PORT=3000
```

#### CORS 配置
确保后端允许前端域名访问（已在 `middleware/cors.go` 中配置）。

## 六、域名和 SSL

### 6.1 配置域名

**前端**：`app.your-domain.com`
**后端**：`api.your-domain.com`

### 6.2 SSL 证书

**使用 Let's Encrypt（免费）**：
```bash
# 安装 certbot
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d api.your-domain.com
```

**或使用 Cloudflare**：
1. 添加域名到 Cloudflare
2. 自动获得 SSL
3. 配置 DNS

## 七、测试清单

部署后测试：
- [ ] 用户登录
- [ ] 查看仓库列表
- [ ] 创建仓库
- [ ] 上传文件
- [ ] 下载文件
- [ ] 代理配置
- [ ] PWA 安装（手机）
- [ ] 离线功能

## 八、成本估算

### 免费方案
- **前端**：Vercel/Netlify（免费）
- **后端**：Railway（免费额度）
- **域名**：Freenom（免费）或购买（$10/年）
- **总计**：$0-10/年

### 付费方案
- **前端**：Vercel Pro（$20/月）
- **后端**：云服务器（$5-10/月）
- **域名**：$10/年
- **总计**：$70-130/月

## 九、维护和更新

### 更新流程
```bash
# 1. 更新代码
git pull

# 2. 重新构建前端
cd git-web
npm run build
vercel --prod

# 3. 重新部署后端
cd git-net-disk
docker-compose down
docker-compose up -d --build
```

### 监控
- 使用 UptimeRobot 监控服务状态
- 配置日志收集
- 设置错误告警

## 十、常见问题

### Q: PWA 和原生 APP 有什么区别？
A: 
- **PWA**：网页技术，无需应用商店，自动更新
- **原生 APP**：需要应用商店，审核周期长，功能更强大

### Q: 推荐哪种方案？
A: 
- **个人使用**：PWA
- **企业使用**：PWA + 原生 APP
- **需要上架**：原生 APP

### Q: 后端如何处理代理？
A: 
- 用户需要自己运行 Clash
- 或者在服务器上配置代理
- APP 连接到 `http://127.0.0.1:7890`

### Q: 如何更新 APP？
A: 
- **PWA**：自动更新
- **原生 APP**：发布新版本到应用商店

## 总结

**最简单的方案**：
1. 前端：Vercel + PWA
2. 后端：Railway
3. 总成本：免费
4. 部署时间：30 分钟

**最完整的方案**：
1. 前端：自己的服务器 + Nginx
2. 后端：Docker + 云服务器
3. 移动端：Capacitor 原生 APP
4. 总成本：$10-20/月
5. 部署时间：2-3 小时

选择适合你的方案开始部署吧！🚀
