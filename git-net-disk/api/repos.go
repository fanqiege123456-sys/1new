package api

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"git-net-disk/api/middleware"
	"git-net-disk/internal/github"
	"git-net-disk/internal/proxy"

	"github.com/gin-gonic/gin"
)

// ReposHandler 仓库相关的 API 处理器
type ReposHandler struct {
	proxyConfig proxy.ProxyConfig
}

// NewReposHandler 创建新的仓库处理器
func NewReposHandler(token string, proxyConfig proxy.ProxyConfig) (*ReposHandler, error) {
	return &ReposHandler{
		proxyConfig: proxyConfig,
	}, nil
}

// ListRepositories 列出用户的仓库
func (h *ReposHandler) ListRepositories(c *gin.Context) {
	// 从请求头获取token
	authHeader := c.GetHeader("Authorization")
	var userToken string
	
	// 调试日志：查看接收到的Authorization头
	fmt.Printf("[DEBUG] Received Authorization header: %s\n", authHeader)
	fmt.Printf("[DEBUG] Authorization header length: %d\n", len(authHeader))
	
	// 处理两种格式的 Authorization 头
	if authHeader != "" {
		// 使用 strings.HasPrefix 更可靠
		if strings.HasPrefix(authHeader, "token ") {
			userToken = strings.TrimPrefix(authHeader, "token ")
			fmt.Printf("[DEBUG] Extracted token using TrimPrefix: %s\n", userToken)
		} else {
			// 格式2: ghp_xxxxxxxx (直接是token值)
			userToken = authHeader
			fmt.Printf("[DEBUG] Using authHeader directly: %s\n", userToken)
		}
	}
	
	// 清理可能的空格
	userToken = strings.TrimSpace(userToken)
	
	// 调试日志：查看最终的token
	fmt.Printf("[DEBUG] Final token: %s\n", userToken)
	fmt.Printf("[DEBUG] Final token length: %d\n", len(userToken))

	if userToken == "" {
		c.JSON(401, gin.H{"error": "Missing authentication token"})
		return
	}

	// 从请求头获取代理配置
	proxyConfig := getProxyConfigFromReposHeader(c)

	// 创建临时GitHub客户端
	client, err := github.NewClient(userToken, proxyConfig)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create GitHub client"})
		return
	}

	repos, err := client.ListRepositories()
	if err != nil {
		c.Error(err)
		return
	}

	middleware.Success(c, repos, "Repositories listed successfully")
}

// CreateRepository 创建新仓库
func (h *ReposHandler) CreateRepository(c *gin.Context) {
	// 从请求头获取token
	authHeader := c.GetHeader("Authorization")
	var userToken string
	
	// 使用 strings.HasPrefix 更可靠
	if authHeader != "" {
		if strings.HasPrefix(authHeader, "token ") {
			userToken = strings.TrimPrefix(authHeader, "token ")
		} else {
			userToken = authHeader
		}
	}
	
	// 清理可能的空格
	userToken = strings.TrimSpace(userToken)

	if userToken == "" {
		c.JSON(401, gin.H{"error": "Missing authentication token"})
		return
	}

	// 从请求头获取代理配置
	proxyConfig := getProxyConfigFromReposHeader(c)

	// 创建临时GitHub客户端
	client, err := github.NewClient(userToken, proxyConfig)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create GitHub client"})
		return
	}

	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Private     bool   `json:"private"`
		AutoInit    bool   `json:"auto_init"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.Error(err)
		return
	}

	repo, err := client.CreateRepository(req.Name, req.Description, req.Private, req.AutoInit)
	if err != nil {
		c.Error(err)
		return
	}

	middleware.Success(c, repo, "Repository created successfully")
}

// RegisterReposRoutes 注册仓库相关的路由
func RegisterReposRoutes(router *gin.RouterGroup, token string, proxyConfig proxy.ProxyConfig) error {
	handler, err := NewReposHandler(token, proxyConfig)
	if err != nil {
		return err
	}

	router.GET("/repos", handler.ListRepositories)
	router.POST("/repos", handler.CreateRepository)

	return nil
}

// getProxyConfigFromReposHeader 从请求头获取代理配置（repos 专用）
func getProxyConfigFromReposHeader(c *gin.Context) proxy.ProxyConfig {
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
