package proxy

import (
	"fmt"
	"net"
	"net/http"
	"net/url"
	"time"
)

// ProxyConfig 代理配置
type ProxyConfig struct {
	Type     string `json:"type"`     // 代理类型: http, socks5
	Host     string `json:"host"`     // 代理主机
	Port     int    `json:"port"`     // 代理端口
	Username string `json:"username"` // 代理用户名
	Password string `json:"password"` // 代理密码
	Enabled  bool   `json:"enabled"`  // 是否启用代理
}

// NewHTTPClient 创建支持代理的 HTTP 客户端
func NewHTTPClient(config ProxyConfig) (*http.Client, error) {
	// 如果是 Trojan 代理，使用专门的客户端
	if config.Enabled && config.Type == "trojan" {
		return NewTrojanHTTPClient(config)
	}

	transport := &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}

	if config.Enabled {
		proxyURL, err := createProxyURL(config)
		if err != nil {
			return nil, err
		}
		transport.Proxy = http.ProxyURL(proxyURL)
	}

	client := &http.Client{
		Transport: transport,
		Timeout:   30 * time.Second,
	}

	return client, nil
}

// createProxyURL 创建代理 URL
func createProxyURL(config ProxyConfig) (*url.URL, error) {
	var proxyURL *url.URL
	var err error

	switch config.Type {
	case "http":
		if config.Username != "" && config.Password != "" {
			proxyURL, err = url.Parse(fmt.Sprintf("http://%s:%s@%s:%d", config.Username, config.Password, config.Host, config.Port))
		} else {
			proxyURL, err = url.Parse(fmt.Sprintf("http://%s:%d", config.Host, config.Port))
		}
	case "socks5":
		if config.Username != "" && config.Password != "" {
			proxyURL, err = url.Parse(fmt.Sprintf("socks5://%s:%s@%s:%d", config.Username, config.Password, config.Host, config.Port))
		} else {
			proxyURL, err = url.Parse(fmt.Sprintf("socks5://%s:%d", config.Host, config.Port))
		}
	default:
		return nil, fmt.Errorf("unsupported proxy type: %s", config.Type)
	}

	if err != nil {
		return nil, fmt.Errorf("invalid proxy URL: %v", err)
	}

	return proxyURL, nil
}
