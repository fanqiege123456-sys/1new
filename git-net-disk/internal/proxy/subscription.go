package proxy

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// SubscriptionConfig 订阅配置
type SubscriptionConfig struct {
	URL string `json:"url"` // 订阅链接
}

// ClashConfig Clash 配置结构
type ClashConfig struct {
	Proxies []ClashProxy `yaml:"proxies"`
}

// ClashProxy Clash 代理节点
type ClashProxy struct {
	Name     string `yaml:"name"`
	Type     string `yaml:"type"` // ss, vmess, trojan, http, socks5
	Server   string `yaml:"server"`
	Port     int    `yaml:"port"`
	Username string `yaml:"username,omitempty"`
	Password string `yaml:"password,omitempty"`
	// 其他字段根据需要添加
}

// V2RayConfig V2Ray 配置（简化）
type V2RayNode struct {
	Protocol string
	Address  string
	Port     int
	Username string
	Password string
}

// ParseSubscription 解析订阅链接并返回第一个可用的代理配置
func ParseSubscription(subURL string) (*ProxyConfig, error) {
	// 下载订阅内容
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	fmt.Printf("[DEBUG] Downloading subscription from: %s\n", subURL)
	
	resp, err := client.Get(subURL)
	if err != nil {
		return nil, fmt.Errorf("failed to download subscription: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("subscription returned status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read subscription: %v", err)
	}

	fmt.Printf("[DEBUG] Subscription content length: %d bytes\n", len(body))
	fmt.Printf("[DEBUG] First 200 chars: %s\n", string(body[:min(200, len(body))]))
	
	// 尝试解析为 Clash 配置
	fmt.Println("[DEBUG] Trying to parse as Clash YAML...")
	config, err := parseClashConfig(body)
	if err == nil && len(config.Proxies) > 0 {
		fmt.Printf("[DEBUG] Found %d proxies in Clash config\n", len(config.Proxies))
		// 使用第一个代理节点
		return convertClashProxyToConfig(&config.Proxies[0])
	}
	fmt.Printf("[DEBUG] Clash YAML parse failed: %v\n", err)

	// 尝试解析为 Base64 编码的节点列表（V2Ray/SS）
	fmt.Println("[DEBUG] Trying to parse as Base64...")
	decoded, err := base64.StdEncoding.DecodeString(string(body))
	if err == nil {
		fmt.Printf("[DEBUG] Base64 decoded length: %d bytes\n", len(decoded))
		fmt.Printf("[DEBUG] Decoded first 200 chars: %s\n", string(decoded[:min(200, len(decoded))]))
		nodes := parseBase64Nodes(string(decoded))
		if len(nodes) > 0 {
			fmt.Printf("[DEBUG] Found %d nodes from Base64\n", len(nodes))
			return &nodes[0], nil
		}
	}
	fmt.Printf("[DEBUG] Base64 parse failed: %v\n", err)

	// 尝试直接解析节点列表
	fmt.Println("[DEBUG] Trying to parse as plain text nodes...")
	nodes := parseBase64Nodes(string(body))
	if len(nodes) > 0 {
		fmt.Printf("[DEBUG] Found %d nodes from plain text\n", len(nodes))
		return &nodes[0], nil
	}

	return nil, fmt.Errorf("unsupported subscription format")
}

// min helper function
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// parseClashConfig 解析 Clash YAML 配置
func parseClashConfig(data []byte) (*ClashConfig, error) {
	var config ClashConfig
	err := yaml.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}
	return &config, nil
}

// convertClashProxyToConfig 将 Clash 代理节点转换为 ProxyConfig
func convertClashProxyToConfig(proxy *ClashProxy) (*ProxyConfig, error) {
	config := &ProxyConfig{
		Enabled:  true,
		Host:     proxy.Server,
		Port:     proxy.Port,
		Username: proxy.Username,
		Password: proxy.Password,
	}

	// 映射代理类型
	switch strings.ToLower(proxy.Type) {
	case "http", "https":
		config.Type = "http"
	case "socks5", "socks":
		config.Type = "socks5"
	case "ss", "shadowsocks":
		// Shadowsocks 需要特殊处理，这里简化为 socks5
		config.Type = "socks5"
	case "vmess", "trojan":
		// 这些协议需要专门的客户端，Go 标准库不支持
		return nil, fmt.Errorf("unsupported proxy type: %s (需要专门的客户端)", proxy.Type)
	default:
		return nil, fmt.Errorf("unknown proxy type: %s", proxy.Type)
	}

	return config, nil
}

// parseBase64Nodes 解析 Base64 编码的节点列表
func parseBase64Nodes(content string) []ProxyConfig {
	var configs []ProxyConfig
	lines := strings.Split(content, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// 尝试解析不同格式的节点
		if strings.HasPrefix(line, "ss://") {
			if config := parseShadowsocksURL(line); config != nil {
				configs = append(configs, *config)
			}
		} else if strings.HasPrefix(line, "trojan://") {
			if config := parseTrojanURL(line); config != nil {
				configs = append(configs, *config)
			}
		} else if strings.HasPrefix(line, "vmess://") {
			// VMess 需要专门的客户端，跳过
			continue
		} else if strings.HasPrefix(line, "http://") || strings.HasPrefix(line, "socks5://") {
			if config := parseSimpleProxyURL(line); config != nil {
				configs = append(configs, *config)
			}
		}
	}

	return configs
}

// parseTrojanURL 解析 Trojan URL
// 格式: trojan://password@server:port?params#name
func parseTrojanURL(trojanURL string) *ProxyConfig {
	// 移除 trojan:// 前缀
	trojanURL = strings.TrimPrefix(trojanURL, "trojan://")
	
	// 分离名称（# 后面的部分）
	parts := strings.Split(trojanURL, "#")
	trojanURL = parts[0]
	
	// 分离参数（? 后面的部分）
	parts = strings.Split(trojanURL, "?")
	mainPart := parts[0]
	
	// 解析 password@server:port
	atIndex := strings.LastIndex(mainPart, "@")
	if atIndex == -1 {
		return nil
	}
	
	password := mainPart[:atIndex]
	serverPort := mainPart[atIndex+1:]
	
	// 解析 server:port
	colonIndex := strings.LastIndex(serverPort, ":")
	if colonIndex == -1 {
		return nil
	}
	
	server := serverPort[:colonIndex]
	portStr := serverPort[colonIndex+1:]
	
	var port int
	fmt.Sscanf(portStr, "%d", &port)
	
	// Trojan 使用 TLS，我们将其转换为 HTTPS 代理的方式处理
	// 注意：这是简化处理，真正的 Trojan 需要专门的客户端
	config := &ProxyConfig{
		Enabled:  true,
		Type:     "trojan",  // 标记为 trojan 类型
		Host:     server,
		Port:     port,
		Password: password,
	}
	
	fmt.Printf("[INFO] Parsed Trojan node: %s:%d\n", server, port)
	
	return config
}

// parseShadowsocksURL 解析 Shadowsocks URL (简化版)
func parseShadowsocksURL(ssURL string) *ProxyConfig {
	// ss:// 格式比较复杂，这里简化处理
	// 实际使用需要专门的 Shadowsocks 客户端
	return nil
}

// parseSimpleProxyURL 解析简单的代理 URL
func parseSimpleProxyURL(proxyURL string) *ProxyConfig {
	u, err := url.Parse(proxyURL)
	if err != nil {
		return nil
	}

	config := &ProxyConfig{
		Enabled: true,
		Type:    u.Scheme,
		Host:    u.Hostname(),
	}

	// 解析端口
	if port := u.Port(); port != "" {
		fmt.Sscanf(port, "%d", &config.Port)
	}

	// 解析用户名和密码
	if u.User != nil {
		config.Username = u.User.Username()
		if password, ok := u.User.Password(); ok {
			config.Password = password
		}
	}

	return config
}

// GetProxyFromSubscription 从订阅链接获取代理配置（带缓存）
var cachedProxyConfig *ProxyConfig
var cachedProxyTime time.Time

func GetProxyFromSubscription(subURL string) (*ProxyConfig, error) {
	// 简单的缓存机制，避免频繁请求订阅链接
	if cachedProxyConfig != nil && time.Since(cachedProxyTime) < 10*time.Minute {
		return cachedProxyConfig, nil
	}

	config, err := ParseSubscription(subURL)
	if err != nil {
		return nil, err
	}

	cachedProxyConfig = config
	cachedProxyTime = time.Now()

	return config, nil
}
