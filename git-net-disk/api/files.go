package api

import (
	"net/url"
	"strconv"
	"strings"
	"git-net-disk/api/middleware"
	"git-net-disk/internal/github"
	"git-net-disk/internal/proxy"

	"github.com/gin-gonic/gin"
)

// FilesHandler 文件相关的 API 处理器
type FilesHandler struct {
	proxyConfig proxy.ProxyConfig
}

// NewFilesHandler 创建新的文件处理器
func NewFilesHandler(token string, proxyConfig proxy.ProxyConfig) (*FilesHandler, error) {
	return &FilesHandler{
		proxyConfig: proxyConfig,
	}, nil
}

// ListFiles 列出仓库中的文件
func (h *FilesHandler) ListFiles(c *gin.Context) {
	// 从请求头获取token
	authHeader := c.GetHeader("Authorization")
	var userToken string
	
	// 使用 strings.HasPrefix 和 TrimPrefix
	if authHeader != "" {
		if strings.HasPrefix(authHeader, "token ") {
			userToken = strings.TrimPrefix(authHeader, "token ")
		} else {
			userToken = authHeader
		}
	}
	
	// 清理空格
	userToken = strings.TrimSpace(userToken)

	if userToken == "" {
		c.JSON(401, gin.H{"error": "Missing authentication token"})
		return
	}

	// 从请求头获取代理配置
	proxyConfig := getProxyConfigFromHeader(c)

	// 创建临时GitHub客户端
	client, err := github.NewClient(userToken, proxyConfig)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create GitHub client"})
		return
	}

	owner := c.Param("owner")
	repo := c.Param("repo")
	path := c.Param("path")
	
	// Gin 的 *path 参数会包含开头的斜杠，需要移除
	path = strings.TrimPrefix(path, "/")

	files, err := client.ListFiles(owner, repo, path)
	if err != nil {
		c.Error(err)
		return
	}

	middleware.Success(c, files, "Files listed successfully")
}

// GetFileContent 获取文件内容
func (h *FilesHandler) GetFileContent(c *gin.Context) {
	// 从请求头获取token
	authHeader := c.GetHeader("Authorization")
	var userToken string
	
	// 使用 strings.HasPrefix 和 TrimPrefix
	if authHeader != "" {
		if strings.HasPrefix(authHeader, "token ") {
			userToken = strings.TrimPrefix(authHeader, "token ")
		} else {
			userToken = authHeader
		}
	}
	
	// 清理空格
	userToken = strings.TrimSpace(userToken)

	if userToken == "" {
		c.JSON(401, gin.H{"error": "Missing authentication token"})
		return
	}

	// 从请求头获取代理配置
	proxyConfig := getProxyConfigFromHeader(c)

	// 创建临时GitHub客户端
	client, err := github.NewClient(userToken, proxyConfig)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create GitHub client"})
		return
	}

	owner := c.Param("owner")
	repo := c.Param("repo")
	path := c.Param("path")
	
	// Gin 的 *path 参数会包含开头的斜杠，需要移除
	path = strings.TrimPrefix(path, "/")

	file, err := client.GetFileContent(owner, repo, path)
	if err != nil {
		c.Error(err)
		return
	}

	middleware.Success(c, file, "File content retrieved successfully")
}

// CreateOrUpdateFile 创建或更新文件
func (h *FilesHandler) CreateOrUpdateFile(c *gin.Context) {
	// 从请求头获取token
	authHeader := c.GetHeader("Authorization")
	var userToken string
	
	// 使用 strings.HasPrefix 和 TrimPrefix
	if authHeader != "" {
		if strings.HasPrefix(authHeader, "token ") {
			userToken = strings.TrimPrefix(authHeader, "token ")
		} else {
			userToken = authHeader
		}
	}
	
	// 清理空格
	userToken = strings.TrimSpace(userToken)

	if userToken == "" {
		c.JSON(401, gin.H{"error": "Missing authentication token"})
		return
	}

	// 从请求头获取代理配置
	proxyConfig := getProxyConfigFromHeader(c)

	// 创建临时GitHub客户端
	client, err := github.NewClient(userToken, proxyConfig)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create GitHub client"})
		return
	}

	owner := c.Param("owner")
	repo := c.Param("repo")
	path := c.Param("path")
	
	// Gin 的 *path 参数会包含开头的斜杠，需要移除
	path = strings.TrimPrefix(path, "/")
	
	// 调试日志
	println("[DEBUG] CreateOrUpdateFile API - owner:", owner, "repo:", repo, "path:", path)

	var req struct {
		Content string `json:"content" binding:"required"`
		Message string `json:"message" binding:"required"`
		Branch  string `json:"branch"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		println("[DEBUG] Failed to parse request body:", err.Error())
		c.Error(err)
		return
	}
	
	println("[DEBUG] Request - Message:", req.Message, "Content length:", len(req.Content), "Branch:", req.Branch)

	file, err := client.CreateOrUpdateFile(owner, repo, path, req.Content, req.Message, req.Branch)
	if err != nil {
		c.Error(err)
		return
	}

	middleware.Success(c, file, "File created or updated successfully")
}

// DeleteFile 删除文件
func (h *FilesHandler) DeleteFile(c *gin.Context) {
	// 从请求头获取token
	authHeader := c.GetHeader("Authorization")
	var userToken string
	
	// 使用 strings.HasPrefix 和 TrimPrefix
	if authHeader != "" {
		if strings.HasPrefix(authHeader, "token ") {
			userToken = strings.TrimPrefix(authHeader, "token ")
		} else {
			userToken = authHeader
		}
	}
	
	// 清理空格
	userToken = strings.TrimSpace(userToken)

	if userToken == "" {
		c.JSON(401, gin.H{"error": "Missing authentication token"})
		return
	}

	// 从请求头获取代理配置
	proxyConfig := getProxyConfigFromHeader(c)

	// 创建临时GitHub客户端
	client, err := github.NewClient(userToken, proxyConfig)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create GitHub client"})
		return
	}

	owner := c.Param("owner")
	repo := c.Param("repo")
	path := c.Param("path")
	
	// Gin 的 *path 参数会包含开头的斜杠，需要移除
	path = strings.TrimPrefix(path, "/")

	var req struct {
		SHA     string `json:"sha" binding:"required"`
		Message string `json:"message" binding:"required"`
		Branch  string `json:"branch"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(err)
		return
	}

	err = client.DeleteFile(owner, repo, path, req.SHA, req.Message, req.Branch)
	if err != nil {
		c.Error(err)
		return
	}

	middleware.Success(c, gin.H{"message": "File deleted successfully"}, "File deleted successfully")
}

// RegisterFilesRoutes 注册文件相关的路由
func RegisterFilesRoutes(router *gin.RouterGroup, token string, proxyConfig proxy.ProxyConfig) error {
	handler, err := NewFilesHandler(token, proxyConfig)
	if err != nil {
		return err
	}

	router.GET("/files/:owner/:repo/*path", handler.ListFiles)
	router.GET("/file/:owner/:repo/*path", handler.GetFileContent)
	router.PUT("/file/:owner/:repo/*path", handler.CreateOrUpdateFile)
	router.DELETE("/file/:owner/:repo/*path", handler.DeleteFile)

	return nil
}

// getProxyConfigFromHeader 从请求头获取代理配置
func getProxyConfigFromHeader(c *gin.Context) proxy.ProxyConfig {
	proxyURL := c.GetHeader("X-Proxy-URL")
	
	config := proxy.ProxyConfig{
		Enabled: false,
	}
	
	if proxyURL == "" {
		return config
	}
	
	// 检查是否是订阅链接（包含 /s/ 或其他订阅特征）
	if strings.Contains(proxyURL, "/s/") || 
	   strings.Contains(proxyURL, "sub") || 
	   strings.Contains(proxyURL, "subscribe") {
		// 尝试解析订阅链接
		subConfig, err := proxy.GetProxyFromSubscription(proxyURL)
		if err != nil {
			println("[WARN] Failed to parse subscription:", err.Error())
			println("[INFO] Falling back to direct connection")
			return config // 返回禁用的配置，使用直连
		}
		
		// 如果是 Trojan，暂时跳过（实现还不完善）
		if subConfig.Type == "trojan" {
			println("[WARN] Trojan proxy not fully supported yet, using direct connection")
			return config
		}
		
		println("[INFO] Using proxy from subscription:", subConfig.Type, subConfig.Host, subConfig.Port)
		return *subConfig
	}
	
	// 解析普通代理URL
	parsedURL, err := url.Parse(proxyURL)
	if err != nil {
		println("[WARN] Invalid proxy URL:", proxyURL)
		return config
	}
	
	config.Enabled = true
	config.Type = parsedURL.Scheme // http 或 socks5
	config.Host = parsedURL.Hostname()
	
	// 解析端口
	if port := parsedURL.Port(); port != "" {
		if portNum, err := strconv.Atoi(port); err == nil {
			config.Port = portNum
		}
	} else {
		// 默认端口
		switch parsedURL.Scheme {
		case "http", "https":
			config.Port = 80
		case "socks5":
			config.Port = 1080
		}
	}
	
	// 解析用户名和密码
	if parsedURL.User != nil {
		config.Username = parsedURL.User.Username()
		if password, ok := parsedURL.User.Password(); ok {
			config.Password = password
		}
	}
	
	println("[INFO] Using proxy:", config.Type, config.Host, config.Port)
	
	return config
}
