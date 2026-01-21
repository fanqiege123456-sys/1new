# 测试 GitHub Token

## 🧪 快速测试

请在命令行运行以下命令（替换 YOUR_TOKEN 为你的实际 Token）：

```bash
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

### 如果成功
会返回你的用户信息：
```json
{
  "login": "your-username",
  "id": 12345,
  ...
}
```

### 如果失败
会返回：
```json
{
  "message": "Bad credentials",
  "documentation_url": "https://docs.github.com/rest"
}
```

---

## 🔍 可能的原因

### 1. Token 格式错误
- Token 应该以 `ghp_` 开头（Personal Access Token）
- 或以 `github_pat_` 开头（Fine-grained personal access token）
- 确保复制时没有多余的空格

### 2. Token 权限不足
访问 https://github.com/settings/tokens

确保 Token 有以下权限：
- ✅ `repo` - Full control of private repositories
- ✅ `user` - Read user profile data

### 3. Token 已过期或被撤销
- 检查 Token 的过期时间
- 确认 Token 没有被删除

---

## 💡 解决方案

### 方案 1: 重新生成 Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置 Token 名称：`GitNetDisk`
4. 选择过期时间：建议 90 天
5. 勾选权限：
   - ✅ `repo` (所有子选项)
   - ✅ `user` (read:user)
6. 点击 "Generate token"
7. **立即复制 Token**（只显示一次！）

### 方案 2: 使用 Fine-grained Token

1. 访问 https://github.com/settings/tokens?type=beta
2. 点击 "Generate new token"
3. 设置：
   - Token name: `GitNetDisk`
   - Expiration: 90 days
   - Repository access: All repositories
   - Permissions:
     - Repository permissions:
       - Contents: Read and write
       - Metadata: Read-only
     - Account permissions:
       - Email addresses: Read-only
4. 生成并复制 Token

---

## 🎯 测试步骤

1. **生成新 Token**
2. **用 curl 测试**：
   ```bash
   curl -H "Authorization: token ghp_YOUR_NEW_TOKEN" https://api.github.com/user
   ```
3. **如果成功，在前端使用新 Token 登录**

---

## 📝 注意事项

- Token 只在生成时显示一次，请妥善保存
- 不要将 Token 提交到代码仓库
- 定期更换 Token
- 如果 Token 泄露，立即撤销并重新生成
