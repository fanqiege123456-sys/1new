package api

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"

	"git-net-disk/api/middleware"
	"git-net-disk/internal/github"
	"git-net-disk/internal/proxy"

	"github.com/gin-gonic/gin"
)

// Server 服务器配置
type Server struct {
	router *gin.Engine
}

// NewServer 创建新的服务器
func NewServer() *Server {
	router := gin.New()

	// 设置中间件
	middleware.SetupMiddlewares(router)

	return &Server{
		router: router,
	}
}

// RegisterRoutes 注册所有路由
func (s *Server) RegisterRoutes() error {
	// 从环境变量获取 GitHub token
	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		token = ""
	}

	// 代理配置
	proxyConfig := proxy.ProxyConfig{
		Enabled: false,
		// 默认禁用代理，可通过环境变量配置
	}

	// API 路由组
	apiGroup := s.router.Group("/api")

	// 注册仓库路由
	if err := RegisterReposRoutes(apiGroup, token, proxyConfig); err != nil {
		return err
	}

	// 注册文件路由
	if err := RegisterFilesRoutes(apiGroup, token, proxyConfig); err != nil {
		return err
	}

	// 注册用户信息路由
	apiGroup.GET("/user", func(c *gin.Context) {
		// 从请求头获取token
		authHeader := c.GetHeader("Authorization")
		var userToken string
		if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "token " {
			userToken = authHeader[7:]
		}

		if userToken == "" {
			c.JSON(401, gin.H{"error": "Missing authentication token"})
			return
		}

		// 创建临时GitHub客户端
		proxyConfig := proxy.ProxyConfig{
			Enabled: false,
		}
		client, err := github.NewClient(userToken, proxyConfig)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create GitHub client"})
			return
		}

		// 获取用户信息
		url := "https://api.github.com/user"
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create request"})
			return
		}

		req.Header.Set("Accept", "application/vnd.github.v3+json")
		req.Header.Set("Authorization", "token "+userToken)

		resp, err := client.Client.Do(req)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to fetch user info"})
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			c.JSON(resp.StatusCode, gin.H{"error": "Failed to fetch user info"})
			return
		}

		// 解析响应
		var userInfo struct {
			ID        int64  `json:"id"`
			Login     string `json:"login"`
			AvatarURL string `json:"avatar_url"`
			Name      string `json:"name"`
			Email     string `json:"email"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
			c.JSON(500, gin.H{"error": "Failed to parse user info"})
			return
		}

		c.JSON(200, userInfo)
	})

	// 注册代理路由
	apiGroup.GET("/proxy", func(c *gin.Context) {
		target := c.Query("target")
		if target == "" {
			c.JSON(400, gin.H{"error": "Missing target parameter"})
			return
		}

		proxyURL := c.GetHeader("x-proxy-url")
		proxyConfig := proxy.ProxyConfig{
			Enabled: false,
		}

		if proxyURL != "" {
			// 解析代理URL
			parsedURL, err := url.Parse(proxyURL)
			if err == nil {
				proxyConfig.Enabled = true
				proxyConfig.Type = parsedURL.Scheme
				proxyConfig.Host = parsedURL.Hostname()
				if port := parsedURL.Port(); port != "" {
					if portNum, err := strconv.Atoi(port); err == nil {
						proxyConfig.Port = portNum
					}
				} else if parsedURL.Scheme == "http" {
					proxyConfig.Port = 80
				} else if parsedURL.Scheme == "https" {
					proxyConfig.Port = 443
				} else if parsedURL.Scheme == "socks5" {
					proxyConfig.Port = 1080
				}
				if parsedURL.User != nil {
					proxyConfig.Username = parsedURL.User.Username()
					if password, ok := parsedURL.User.Password(); ok {
						proxyConfig.Password = password
					}
				}
			}
		}

		client, err := proxy.NewHTTPClient(proxyConfig)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create proxy client"})
			return
		}

		req, err := http.NewRequest("GET", target, nil)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create request"})
			return
		}

		// 复制请求头
		for k, v := range c.Request.Header {
			if k != "Host" && k != "Content-Length" {
				req.Header[k] = v
			}
		}

		resp, err := client.Do(req)
		if err != nil {
			c.JSON(500, gin.H{"error": "Proxy request failed"})
			return
		}
		defer resp.Body.Close()

		// 复制响应头
		for k, v := range resp.Header {
			c.Header(k, v[0])
		}
		c.Status(resp.StatusCode)

		// 复制响应体
		io.Copy(c.Writer, resp.Body)
	})

	// 健康检查路由
	s.router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	return nil
}

// GetRouter 获取 Gin 路由器
func (s *Server) GetRouter() *gin.Engine {
	return s.router
}

// Run 启动服务器
func (s *Server) Run(addr string) error {
	return s.router.Run(addr)
}
