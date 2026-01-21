# GitNetDisk - 极客网盘

基于 GitHub 的私有云盘，支持 Web 端和移动端使用。

## 功能特性

- ✅ GitHub 仓库管理
- ✅ 文件上传/下载/删除
- ✅ 文件夹浏览
- ✅ 代理配置支持
- ✅ PWA 支持（可安装到手机桌面）
- ✅ 响应式设计
- ✅ 暗黑模式

## 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 生产构建

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## PWA 打包

### 1. 生成图标

访问 https://www.pwabuilder.com/imageGenerator 上传 `public/icon.svg` 生成图标，或使用命令行：

```bash
npm install -g sharp-cli
cd public
npx sharp -i icon.svg -o pwa-192x192.png resize 192 192
npx sharp -i icon.svg -o pwa-512x512.png resize 512 512
npx sharp -i icon.svg -o apple-touch-icon.png resize 180 180
```

### 2. 构建并部署

```bash
# 构建
npm run build

# 部署到 Vercel
npm install -g vercel
vercel --prod
```

### 3. 在手机上安装

1. 用手机浏览器打开部署后的网址
2. 点击"添加到主屏幕"
3. 完成！

## 配置

### 开发环境

默认连接到 `http://localhost:3000` 后端

### 生产环境

创建 `.env.production` 文件：

```env
VITE_API_URL=https://your-backend-url.com
```

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand (状态管理)
- Octokit (GitHub API)
- Vite PWA Plugin

## 项目结构

```
git-web/
├── components/          # React 组件
│   ├── Button.tsx
│   ├── FileBrowser.tsx
│   ├── RepoList.tsx
│   ├── Settings.tsx
│   └── ...
├── services/           # API 服务
│   ├── githubService.ts
│   └── mockService.ts
├── public/            # 静态资源
│   ├── icon.svg
│   └── pwa-*.png
├── App.tsx            # 主应用
├── index.tsx          # 入口文件
└── vite.config.ts     # Vite 配置
```

## 文档

详细文档请查看 `dose/` 目录：

- [快速打包指南](../dose/快速打包指南.md)
- [APP打包部署指南](../dose/APP打包部署指南.md)
- [PWA图标生成指南](../dose/PWA图标生成指南.md)
- [前端开发文档](../dose/前端开发文档.md)

## 许可证

MIT
