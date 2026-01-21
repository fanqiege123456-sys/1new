# 前端需要的 API 接口清单

## 🔐 认证方式

所有接口都需要在请求头中携带 GitHub Personal Access Token：

```http
Authorization: token ghp_xxxxxxxxxxxx
```

**注意**: 使用 `token` 而不是 `Bearer`，这是 GitHub API 的标准格式。

---

## 📋 必需的 API 接口（MVP）

### 1. 获取用户信息

**接口**: `GET /api/user`

**说明**: 获取当前登录用户的基本信息

**请求头**:
```http
Authorization: token ghp_xxxxxxxxxxxx
```

**响应示例**:
```json
{
  "id": 12345678,
  "login": "username",
  "avatar_url": "https://avatars.githubusercontent.com/u/12345678?v=4",
  "name": "User Name",
  "email": "user@example.com"
}
```

**前端使用**: 登录时显示用户信息

---

### 2. 获取仓库列表

**接口**: `GET /api/repos`

**说明**: 获取用户的所有仓库列表

**请求头**:
```http
Authorization: token ghp_xxxxxxxxxxxx
```

**查询参数** (可选):
- `sort`: 排序方式，默认 `updated`
- `per_page`: 每页数量，默认 100

**响应示例**:
```json
[
  {
    "id": 123456,
    "name": "my-repo",
    "full_name": "username/my-repo",
    "description": "My awesome repository",
    "private": false,
    "html_url": "https://github.com/username/my-repo",
    "updated_at": "2026-01-21T10:30:00Z",
    "language": "TypeScript",
    "default_branch": "main"
  }
]
```

**前端使用**: 显示仓库列表

---

### 3. 获取文件/目录列表

**接口**: `GET /api/files/:owner/:repo/*path`

**说明**: 获取指定仓库路径下的文件和目录列表

**路径参数**:
- `owner`: 仓库所有者
- `repo`: 仓库名称
- `path`: 文件路径（可选，空表示根目录）

**请求示例**:
```http
GET /api/files/username/my-repo/src/components
Authorization: token ghp_xxxxxxxxxxxx
```

**响应示例**:
```json
[
  {
    "name": "Button.tsx",
    "path": "src/components/Button.tsx",
    "sha": "abc123def456",
    "size": 1234,
    "type": "file",
    "download_url": "https://raw.githubusercontent.com/..."
  },
  {
    "name": "utils",
    "path": "src/components/utils",
    "sha": "def456abc123",
    "size": 0,
    "type": "dir"
  }
]
```

**前端使用**: 文件浏览器显示文件列表

---

### 4. 获取文件内容

**接口**: `GET /api/file/:owner/:repo/*path`

**说明**: 获取指定文件的内容

**路径参数**:
- `owner`: 仓库所有者
- `repo`: 仓库名称
- `path`: 文件路径

**请求示例**:
```http
GET /api/file/username/my-repo/README.md
Authorization: token ghp_xxxxxxxxxxxx
```

**响应示例**:
```json
{
  "name": "README.md",
  "path": "README.md",
  "sha": "abc123def456",
  "size": 1234,
  "content": "IyBNeSBQcm9qZWN0...",  // Base64 编码
  "encoding": "base64"
}
```

**前端使用**: 文件预览、下载

---

### 5. 创建/更新文件

**接口**: `PUT /api/file/:owner/:repo/*path`

**说明**: 创建新文件或更新现有文件

**路径参数**:
- `owner`: 仓库所有者
- `repo`: 仓库名称
- `path`: 文件路径

**请求头**:
```http
Authorization: token ghp_xxxxxxxxxxxx
Content-Type: application/json
```

**请求体**:
```json
{
  "message": "Upload file via GitNetDisk",
  "content": "IyBNeSBQcm9qZWN0...",  // Base64 编码的文件内容
  "sha": "abc123def456"  // 可选，更新文件时必须提供
}
```

**响应示例**:
```json
{
  "content": {
    "name": "test.txt",
    "path": "test.txt",
    "sha": "new123sha456",
    "size": 100
  },
  "commit": {
    "sha": "commit123sha456",
    "message": "Upload file via GitNetDisk"
  }
}
```

**前端使用**: 文件上传

---

### 6. 删除文件

**接口**: `DELETE /api/file/:owner/:repo/*path`

**说明**: 删除指定文件

**路径参数**:
- `owner`: 仓库所有者
- `repo`: 仓库名称
- `path`: 文件路径

**请求头**:
```http
Authorization: token ghp_xxxxxxxxxxxx
Content-Type: application/json
```

**请求体**:
```json
{
  "message": "Delete file via GitNetDisk",
  "sha": "abc123def456"  // 必须提供文件的 SHA
}
```

**响应示例**:
```json
{
  "commit": {
    "sha": "commit123sha456",
    "message": "Delete file via GitNetDisk"
  }
}
```

**前端使用**: 文件删除

---

### 7. 创建仓库

**接口**: `POST /api/repos`

**说明**: 创建新的 GitHub 仓库

**请求头**:
```http
Authorization: token ghp_xxxxxxxxxxxx
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "my-new-repo",
  "description": "My new repository",
  "private": false,
  "auto_init": true
}
```

**响应示例**:
```json
{
  "id": 789012,
  "name": "my-new-repo",
  "full_name": "username/my-new-repo",
  "description": "My new repository",
  "private": false,
  "html_url": "https://github.com/username/my-new-repo",
  "created_at": "2026-01-21T10:30:00Z",
  "updated_at": "2026-01-21T10:30:00Z",
  "language": null,
  "default_branch": "main"
}
```

**前端使用**: 创建新仓库

---

## 🔄 后端实现建议

### 通用代理模式

后端可以作为 GitHub API 的代理，直接转发请求：

```javascript
// 伪代码示例
app.get('/api/*', async (req, res) => {
  const token = req.headers.authorization; // "token ghp_xxx"
  const githubApiUrl = `https://api.github.com${req.path.replace('/api', '')}`;
  
  const response = await fetch(githubApiUrl, {
    headers: {
      'Authorization': token,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitNetDisk'
    }
  });
  
  const data = await response.json();
  res.json(data);
});
```

### 错误处理

所有接口都应该返回标准的错误格式：

```json
{
  "error": "错误信息",
  "message": "详细描述",
  "status": 404
}
```

---

## 📊 接口优先级

### 第一优先级（必须实现）
1. ✅ `GET /api/user` - 获取用户信息
2. ✅ `GET /api/repos` - 获取仓库列表
3. ✅ `GET /api/files/:owner/:repo/*path` - 获取文件列表
4. ✅ `PUT /api/file/:owner/:repo/*path` - 上传文件

### 第二优先级（推荐实现）
5. ⭐ `POST /api/repos` - 创建仓库
6. ⭐ `GET /api/file/:owner/:repo/*path` - 获取文件内容

### 第三优先级（可选）
7. 🔹 `DELETE /api/file/:owner/:repo/*path` - 删除文件

---

## 🧪 测试用例

### 测试 1: 获取用户信息
```bash
curl -X GET http://localhost:3000/api/user \
  -H "Authorization: token ghp_xxxxxxxxxxxx"
```

### 测试 2: 获取仓库列表
```bash
curl -X GET http://localhost:3000/api/repos \
  -H "Authorization: token ghp_xxxxxxxxxxxx"
```

### 测试 3: 获取文件列表
```bash
curl -X GET http://localhost:3000/api/files/username/repo-name/ \
  -H "Authorization: token ghp_xxxxxxxxxxxx"
```

### 测试 4: 上传文件
```bash
curl -X PUT http://localhost:3000/api/file/username/repo-name/test.txt \
  -H "Authorization: token ghp_xxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test upload",
    "content": "SGVsbG8gV29ybGQh"
  }'
```

---

## 📝 注意事项

1. **Token 格式**: 必须使用 `token ghp_xxx` 而不是 `Bearer ghp_xxx`
2. **CORS**: 后端需要允许来自 `http://localhost:5173` 的跨域请求
3. **文件内容**: 文件内容必须使用 Base64 编码
4. **路径处理**: 路径中的特殊字符需要正确处理（如空格、中文等）
5. **错误处理**: 返回清晰的错误信息，方便前端调试

---

## 🔗 GitHub API 文档参考

- [GitHub REST API 文档](https://docs.github.com/en/rest)
- [仓库内容 API](https://docs.github.com/en/rest/repos/contents)
- [仓库 API](https://docs.github.com/en/rest/repos/repos)
- [用户 API](https://docs.github.com/en/rest/users/users)
