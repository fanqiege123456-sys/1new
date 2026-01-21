# Token 验证指南

## 🔍 当前问题

**错误**: `GitHub API error: Bad credentials`

**说明**: 后端成功接收到请求，但 GitHub API 返回凭证无效。

---

## ✅ 验证步骤

### 1. 验证 Token 是否有效

在命令行直接测试 Token：

```bash
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     -H "User-Agent: GitNetDisk" \
     https://api.github.com/user
```

**如果成功**，会返回你的用户信息：
```json
{
  "login": "your-username",
  "id": 12345678,
  "avatar_url": "...",
  ...
}
```

**如果失败**，会返回：
```json
{
  "message": "Bad credentials",
  "documentation_url": "..."
}
```

---

### 2. 检查 Token 权限

访问 GitHub Token 设置页面：
https://github.com/settings/tokens

确认你的 Token 有以下权限：
- ✅ `repo` - 完整的仓库访问权限
- ✅ `user` - 读取用户信息

---

### 3. 检查后端代码

后端在转发 Authorization 头时，**不应该修改它**。

#### ❌ 错误的做法：

```go
// 错误 1: 重新拼接 token
token := strings.TrimPrefix(authHeader, "token ")
req.Header.Set("Authorization", "token " + token)

// 错误 2: 使用 Bearer
req.Header.Set("Authorization", "Bearer " + token)

// 错误 3: 只传递 token 值
req.Header.Set("Authorization", token)
```

#### ✅ 正确的做法：

```go
// 方法 1: 直接转发（推荐）
authHeader := c.GetHeader("Authorization")
req.Header.Set("Authorization", authHeader)

// 方法 2: 如果需要验证格式
authHeader := c.GetHeader("Authorization")
if !strings.HasPrefix(authHeader, "token ") {
    c.JSON(401, gin.H{"error": "Invalid authorization format"})
    return
}
req.Header.Set("Authorization", authHeader)
```

---

## 🔧 后端代码检查清单

请检查后端代码中的以下部分：

### 1. 获取 Authorization 头

```go
// 在 ListRepositories 函数中
authHeader := c.GetHeader("Authorization")

// 打印日志查看（调试用，生产环境要删除）
log.Printf("Received Authorization: %s", authHeader)
```

### 2. 转发到 GitHub API

```go
req, err := http.NewRequest("GET", "https://api.github.com/user/repos", nil)
if err != nil {
    // 处理错误
}

// 直接转发 Authorization 头
req.Header.Set("Authorization", authHeader)

// 必须设置的其他头
req.Header.Set("Accept", "application/vnd.github.v3+json")
req.Header.Set("User-Agent", "GitNetDisk/1.0")
```

### 3. 检查 GitHub API 响应

```go
resp, err := client.Do(req)
if err != nil {
    // 处理错误
}
defer resp.Body.Close()

body, _ := io.ReadAll(resp.Body)

// 打印 GitHub API 的响应（调试用）
log.Printf("GitHub API Status: %d", resp.StatusCode)
log.Printf("GitHub API Response: %s", string(body))

if resp.StatusCode != 200 {
    // GitHub API 返回错误
    c.JSON(resp.StatusCode, gin.H{
        "error": "GitHub API error",
        "details": string(body),
    })
    return
}
```

---

## 🧪 调试建议

### 1. 添加详细日志

在后端的 `ListRepositories` 函数中添加日志：

```go
func (h *ReposHandler) ListRepositories(c *gin.Context) {
    // 1. 打印收到的 Authorization 头
    authHeader := c.GetHeader("Authorization")
    log.Printf("[DEBUG] Authorization header: %s", authHeader)
    
    // 2. 创建 GitHub API 请求
    req, _ := http.NewRequest("GET", "https://api.github.com/user/repos", nil)
    req.Header.Set("Authorization", authHeader)
    req.Header.Set("Accept", "application/vnd.github.v3+json")
    req.Header.Set("User-Agent", "GitNetDisk/1.0")
    
    // 3. 打印请求头
    log.Printf("[DEBUG] Request headers: %v", req.Header)
    
    // 4. 发送请求
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        log.Printf("[ERROR] Request failed: %v", err)
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    defer resp.Body.Close()
    
    // 5. 打印响应
    body, _ := io.ReadAll(resp.Body)
    log.Printf("[DEBUG] GitHub API status: %d", resp.StatusCode)
    log.Printf("[DEBUG] GitHub API response: %s", string(body))
    
    // 6. 处理响应
    if resp.StatusCode != 200 {
        c.JSON(resp.StatusCode, gin.H{
            "error": "GitHub API error",
            "details": string(body),
        })
        return
    }
    
    // ... 继续处理
}
```

### 2. 对比前端发送的和后端转发的

**前端发送**:
```
Authorization: token ghp_xxxxxxxxxxxx
```

**后端应该转发**:
```
Authorization: token ghp_xxxxxxxxxxxx
```

**不应该变成**:
```
Authorization: Bearer ghp_xxxxxxxxxxxx  ❌
Authorization: ghp_xxxxxxxxxxxx        ❌
Authorization: token token ghp_xxx     ❌
```

---

## 📋 快速修复步骤

1. **在后端添加日志**，查看实际发送给 GitHub 的 Authorization 头
2. **使用 curl 测试 Token**，确认 Token 本身是有效的
3. **对比日志**，看前端发送的和后端转发的是否一致
4. **修改后端代码**，确保直接转发 Authorization 头，不做任何修改

---

## 💡 最可能的问题

根据经验，最常见的问题是：

### 问题 1: 后端重复添加了 "token" 前缀

```go
// ❌ 错误
authHeader := c.GetHeader("Authorization")  // "token ghp_xxx"
token := strings.TrimPrefix(authHeader, "token ")  // "ghp_xxx"
req.Header.Set("Authorization", "token " + token)  // "token ghp_xxx" ✅

// 但如果前端已经发送了 "token ghp_xxx"，
// 而后端又添加了一次，就会变成：
req.Header.Set("Authorization", "token token ghp_xxx")  // ❌ 错误！
```

### 问题 2: 后端使用了 Bearer 而不是 token

```go
// ❌ 错误
authHeader := c.GetHeader("Authorization")  // "token ghp_xxx"
token := strings.TrimPrefix(authHeader, "token ")  // "ghp_xxx"
req.Header.Set("Authorization", "Bearer " + token)  // "Bearer ghp_xxx" ❌

// GitHub API 不接受 Bearer，只接受 token
```

---

## 🎯 建议的修复代码

```go
func (h *ReposHandler) ListRepositories(c *gin.Context) {
    // 1. 直接获取 Authorization 头，不做任何修改
    authHeader := c.GetHeader("Authorization")
    
    if authHeader == "" {
        c.JSON(401, gin.H{"error": "Missing authorization header"})
        return
    }
    
    // 2. 创建 GitHub API 请求
    req, err := http.NewRequest("GET", "https://api.github.com/user/repos?sort=updated&per_page=100", nil)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // 3. 直接转发 Authorization 头
    req.Header.Set("Authorization", authHeader)
    req.Header.Set("Accept", "application/vnd.github.v3+json")
    req.Header.Set("User-Agent", "GitNetDisk/1.0")
    
    // 4. 发送请求
    client := &http.Client{Timeout: 30 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    defer resp.Body.Close()
    
    // 5. 读取响应
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // 6. 检查状态码
    if resp.StatusCode != 200 {
        c.JSON(resp.StatusCode, gin.H{
            "error": "GitHub API error",
            "status": resp.StatusCode,
            "details": string(body),
        })
        return
    }
    
    // 7. 解析并返回
    var repos []interface{}
    if err := json.Unmarshal(body, &repos); err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(200, gin.H{
        "code": 200,
        "message": "Repositories listed successfully",
        "data": repos,
    })
}
```

---

请按照这个指南检查后端代码，并告诉我日志输出的内容！
