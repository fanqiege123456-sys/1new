# PWA 图标生成指南

## 需要的图标尺寸

PWA 需要以下尺寸的图标：
- `pwa-192x192.png` - 192x192 像素
- `pwa-512x512.png` - 512x512 像素
- `apple-touch-icon.png` - 180x180 像素（iOS）
- `favicon.ico` - 32x32 像素

## 方法 1：在线生成（推荐）

### 使用 PWA Asset Generator

1. 访问：https://www.pwabuilder.com/imageGenerator
2. 上传 `git-web/public/icon.svg` 文件
3. 点击 "Generate" 生成所有尺寸
4. 下载并解压到 `git-web/public/` 目录

### 使用 RealFaviconGenerator

1. 访问：https://realfavicongenerator.net/
2. 上传 `git-web/public/icon.svg`
3. 配置选项后生成
4. 下载并解压到 `git-web/public/` 目录

## 方法 2：使用命令行工具

### 安装 sharp-cli

```bash
npm install -g sharp-cli
```

### 生成图标

```bash
cd git-web/public

# 生成 192x192
npx sharp -i icon.svg -o pwa-192x192.png resize 192 192

# 生成 512x512
npx sharp -i icon.svg -o pwa-512x512.png resize 512 512

# 生成 180x180 (Apple)
npx sharp -i icon.svg -o apple-touch-icon.png resize 180 180

# 生成 32x32 (Favicon)
npx sharp -i icon.svg -o favicon-32x32.png resize 32 32
```

## 方法 3：使用 Photoshop/GIMP

1. 打开 `icon.svg`
2. 导出为 PNG，设置对应尺寸
3. 保存到 `git-web/public/` 目录

## 方法 4：临时方案（快速测试）

如果只是想快速测试 PWA 功能，可以使用纯色占位图标：

```bash
cd git-web/public

# 创建蓝色占位图标（需要 ImageMagick）
magick -size 192x192 xc:#3b82f6 pwa-192x192.png
magick -size 512x512 xc:#3b82f6 pwa-512x512.png
magick -size 180x180 xc:#3b82f6 apple-touch-icon.png
```

## 验证图标

生成后，确保以下文件存在：
- ✅ `git-web/public/pwa-192x192.png`
- ✅ `git-web/public/pwa-512x512.png`
- ✅ `git-web/public/apple-touch-icon.png`
- ✅ `git-web/public/favicon.ico`（可选）

## 图标设计建议

1. **简洁明了**：图标应该在小尺寸下也清晰可辨
2. **品牌一致**：使用项目的主题色（蓝色 #3b82f6）
3. **安全区域**：重要内容保持在中心 80% 区域内
4. **背景色**：使用纯色背景，避免透明（Android 会添加白色背景）

## 当前图标说明

`icon.svg` 包含：
- 蓝色背景（#3b82f6）
- GitHub 风格的圆形图标
- 文件夹图标
- 连接线表示云存储

你可以根据需要修改这个 SVG 文件。
