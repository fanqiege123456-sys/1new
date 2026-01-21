# GitNetDisk 后端 API 文档

## 1. 服务信息

- **服务地址**: `http://localhost:3000`
- **API 基础路径**: `/api`
- **认证方式**: GitHub Personal Access Token (通过 `Authorization` 请求头传递)
- **认证格式**: `Authorization: token YOUR_GITHUB_TOKEN`

## 2. 接口清单

### 2.1 用户相关

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/user` | `GET` | 获取用户信息 |

### 2.2 仓库管理

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/repos` | `GET` | 获取仓库列表 |
| `/api/repos` | `POST` | 创建新仓库 |

### 2.3 文件操作

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/files/:owner/:repo/*path` | `GET` | 获取文件列表 |
| `/api/file/:owner/:repo/*path` | `GET` | 获取文件内容 |
| `/api/file/:owner/:repo/*path` | `PUT` | 创建或更新文件 |
| `/api/file/:owner/:repo/*path` | `DELETE` | 删除文件 |

### 2.4 代理功能

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/proxy` | `GET` | 代理请求 |

### 2.5 健康检查

| 接口 | 方法 | 描述 |
|------|------|------|
| `/health` | `GET` | 健康检查 |

## 3. 详细接口说明

### 3.1 用户信息

#### GET /api/user

**功能**: 获取当前认证用户的 GitHub 信息

**请求头**:
- `Authorization`: `token YOUR_GITHUB_TOKEN` (必需)

**响应格式**:

成功 (200 OK):
```json
{
  "id": 12345678,
  "login": "username",
  "avatar_url": "https://avatars.githubusercontent.com/u/12345678?v=4",
  "name": "Full Name",
  "email": "user@example.com"
}
```

失败 (401 Unauthorized):
```json
{
  "error": "Missing authentication token"
}
```

### 3.2 仓库管理

#### GET /api/repos

**功能**: 获取用户的仓库列表

**请求头**:
- `Authorization`: `token YOUR_GITHUB_TOKEN` (必需)

**响应格式**:

成功 (200 OK):
```json
{
  "code": 200,
  "message": "Repositories listed successfully",
  "data": [
    {
      "id": 123456789,
      "name": "repo-name",
      "full_name": "username/repo-name",
      "description": "Repository description",
      "private": false,
      "owner": {
        "login": "username",
        "id": 12345678,
        "avatar_url": "https://avatars.githubusercontent.com/u/12345678?v=4"
      },
      "html_url": "https://github.com/username/repo-name",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "size": 1024
    }
  ]
}
```

#### POST /api/repos

**功能**: 创建新仓库

**请求头**:
- `Authorization`: `token YOUR_GITHUB_TOKEN` (必需)
- `Content-Type`: `application/json`

**请求体**:
```json
{
  "name": "repo-name",
  "description": "Repository description",
  "private": false,
  "auto_init": true
}
```

**参数说明**:
- `name`: 仓库名称 (必需)
- `description`: 仓库描述 (可选)
- `private`: 是否私有 (可选，默认 false)
- `auto_init`: 是否自动初始化 (可选，默认 false)

**响应格式**:

成功 (200 OK):
```json
{
  "code": 200,
  "message": "Repository created successfully",
  "data": {
    "id": 123456789,
    "name": "repo-name",
    "full_name": "username/repo-name",
    "description": "Repository description",
    "private": false,
    "owner": {
      "login": "username",
      "id": 12345678,
      "avatar_url": "https://avatars.githubusercontent.com/u/12345678?v=4"
    },
    "html_url": "https://github.com/username/repo-name",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "size": 1024
  }
}
```

### 3.3 文件操作

#### GET /api/files/:owner/:repo/*path

**功能**: 获取仓库中指定路径的文件列表

**请求头**:
- `Authorization`: `token YOUR_GITHUB_TOKEN` (必需)

**路径参数**:
- `owner`: 仓库所有者用户名
- `repo`: 仓库名称
- `path`: 文件路径 (可选，默认为根目录)

**响应格式**:

成功 (200 OK):
```json
{
  "code": 200,
  "message": "Files listed successfully",
  "data": [
    {
      "name": "file.txt",
      "path": "file.txt",
      "sha": "abc123def456",
      "size": 1024,
      "url": "https://api.github.com/repos/owner/repo/contents/file.txt",
      "html_url": "https://github.com/owner/repo/blob/main/file.txt",
      "git_url": "https://api.github.com/repos/owner/repo/git/blobs/abc123def456",
      "download_url": "https://raw.githubusercontent.com/owner/repo/main/file.txt",
      "type": "file"
    },
    {
      "name": "folder",
      "path": "folder",
      "sha": "def456abc123",
      "size": 0,
      "url": "https://api.github.com/repos/owner/repo/contents/folder",
      "html_url": "https://github.com/owner/repo/tree/main/folder",
      "git_url": "https://api.github.com/repos/owner/repo/git/trees/def456abc123",
      "download_url": null,
      "type": "dir"
    }
  ]
}
```

#### GET /api/file/:owner/:repo/*path

**功能**: 获取文件内容

**请求头**:
- `Authorization`: `token YOUR_GITHUB_TOKEN` (必需)

**路径参数**:
- `owner`: 仓库所有者用户名
- `repo`: 仓库名称
- `path`: 文件路径

**响应格式**:

成功 (200 OK):
```json
{
  "code": 200,
  "message": "File content retrieved successfully",
  "data": {
    "name": "file.txt",
    "path": "file.txt",
    "sha": "abc123def456",
    "size": 1024,
    "url": "https://api.github.com/repos/owner/repo/contents/file.txt",
    "html_url": "https://github.com/owner/repo/blob/main/file.txt",
    "git_url": "https://api.github.com/repos/owner/repo/git/blobs/abc123def456",
    "download_url": "https://raw.githubusercontent.com/owner/repo/main/file.txt",
    "type": "file",
    "content": "base64编码的文件内容",
    "encoding": "base64"
  }
}
```

#### PUT /api/file/:owner/:repo/*path

**功能**: 创建或更新文件

**请求头**:
- `Authorization`: `token YOUR_GITHUB_TOKEN` (必需)
- `Content-Type`: `application/json`

**路径参数**:
- `owner`: 仓库所有者用户名
- `repo`: 仓库名称
- `path`: 文件路径

**请求体**:
```json
{
  "content": "base64编码的文件内容",
  "message": "Commit message",
  "branch": "main"
}
```

**参数说明**:
- `content`: 文件内容 (base64编码，必需)
- `message`: 提交消息 (必需)
- `branch`: 分支名称 (可选，默认使用仓库默认分支)

**响应格式**:

成功 (200 OK):
```json
{
  "code": 200,
  "message": "File created or updated successfully",
  "data": {
    "name": "file.txt",
    "path": "file.txt",
    "sha": "new-sha-value",
    "size": 1024,
    "url": "https://api.github.com/repos/owner/repo/contents/file.txt",
    "html_url": "https://github.com/owner/repo/blob/main/file.txt",
    "git_url": "https://api.github.com/repos/owner/repo/git/blobs/new-sha-value",
    "download_url": "https://raw.githubusercontent.com/owner/repo/main/file.txt",
    "type": "file"
  }
}
```

#### DELETE /api/file/:owner/:repo/*path

**功能**: 删除文件

**请求头**:
- `Authorization`: `token YOUR_GITHUB_TOKEN` (必需)
- `Content-Type`: `application/json`

**路径参数**:
- `owner`: 仓库所有者用户名
- `repo`: 仓库名称
- `path`: 文件路径

**请求体**:
```json
{
  "sha": "current-sha-value",
  "message": "Delete file",
  "branch": "main"
}
```

**参数说明**:
- `sha`: 文件当前的 SHA 值 (必需)
- `message`: 提交消息 (必需)
- `branch`: 分支名称 (可选，默认使用仓库默认分支)

**响应格式**:

成功 (200 OK):
```json
{
  "code": 200,
  "message": "File deleted successfully",
  "data": {
    "message": "File deleted successfully"
  }
}
```

### 3.4 代理功能

#### GET /api/proxy

**功能**: 代理请求到目标 URL

**查询参数**:
- `target`: 目标 URL (必需，需要 URL 编码)

**请求头**:
- `x-proxy-url`: 代理服务器 URL (可选)
- 其他 GitHub API 所需的请求头

**响应格式**:

- 直接返回目标 URL 的响应内容
- 响应状态码与目标 URL 的响应一致
- 响应头与目标 URL 的响应一致

### 3.5 健康检查

#### GET /health

**功能**: 检查服务健康状态

**响应格式**:

成功 (200 OK):
```json
{
  "status": "ok"
}
```

## 4. 错误处理

### 4.1 通用错误格式

```json
{
  "error": "错误信息"
}
```

### 4.2 常见错误码

| 状态码 | 描述 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 认证失败或缺少认证信息 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 502 | 代理请求失败 |

## 5. 示例请求

### 5.1 获取用户信息

```bash
curl -X GET "http://localhost:3000/api/user" \
  -H "Authorization: token YOUR_GITHUB_TOKEN"
```

### 5.2 获取仓库列表

```bash
curl -X GET "http://localhost:3000/api/repos" \
  -H "Authorization: token YOUR_GITHUB_TOKEN"
```

### 5.3 创建仓库

```bash
curl -X POST "http://localhost:3000/api/repos" \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"test-repo","description":"Test repository","private":false,"auto_init":true}'
```

### 5.4 获取文件列表

```bash
curl -X GET "http://localhost:3000/api/files/username/repo-name/path/to/folder" \
  -H "Authorization: token YOUR_GITHUB_TOKEN"
```

### 5.5 上传文件

```bash
curl -X PUT "http://localhost:3000/api/file/username/repo-name/path/to/file.txt" \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"base64编码的文件内容","message":"Upload file","branch":"main"}'
```

## 6. 注意事项

1. **认证**: 所有 API 请求（除了健康检查）都需要提供有效的 GitHub Personal Access Token
2. **权限**: Token 需要具备 `repo` 权限以访问私有仓库
3. **速率限制**: 遵循 GitHub API 的速率限制规则
4. **文件大小**: GitHub 对单个文件大小有限制（最大 100MB）
5. **编码**: 文件内容需要使用 base64 编码
6. **代理**: 使用代理功能时，确保代理服务器可访问 GitHub

## 7. 技术实现

- **后端框架**: Go + Gin
- **GitHub API**: 直接调用 GitHub REST API v3
- **认证**: 基于 GitHub Personal Access Token
- **代理**: 支持 HTTP 和 SOCKS5 代理
- **错误处理**: 统一的错误处理机制

## 8. 部署配置

### 8.1 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `GITHUB_TOKEN` | GitHub Personal Access Token (可选) | 空 |

### 8.2 启动命令

```bash
# 直接启动
cd git-net-disk
go run main.go

# 或构建后运行
go build -o gitnetdisk-server
gitnetdisk-server
```

## 9. 开发与调试

- **开发模式**: 默认以调试模式运行
- **日志**: 控制台输出详细日志
- **健康检查**: 可通过 `/health` 接口检查服务状态

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-21
**适用前端版本**: GitNetDisk 前端 v1.0+