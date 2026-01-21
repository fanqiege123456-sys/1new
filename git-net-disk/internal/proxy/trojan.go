package proxy

import (
	"context"
	"crypto/sha256"
	"crypto/tls"
	"encoding/hex"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

// TrojanConn Trojan 连接包装器
type TrojanConn struct {
	net.Conn
}

// NewTrojanHTTPClient 创建支持 Trojan 的 HTTP 客户端
func NewTrojanHTTPClient(config ProxyConfig) (*http.Client, error) {
	if config.Type != "trojan" {
		return nil, fmt.Errorf("not a trojan config")
	}

	// 创建自定义 Transport
	// 关键：对于 HTTPS 请求，我们需要在 Trojan 隧道内再做一次 TLS
	transport := &http.Transport{
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			// 通过 Trojan 建立连接
			conn, err := dialTrojan(config, addr)
			if err != nil {
				return nil, err
			}
			
			// 如果目标是 HTTPS (443端口)，需要在 Trojan 隧道内再做 TLS
			if addr == "api.github.com:443" || strings.HasSuffix(addr, ":443") {
				host, _, _ := net.SplitHostPort(addr)
				tlsConfig := &tls.Config{
					ServerName:         host,
					InsecureSkipVerify: false,
				}
				tlsConn := tls.Client(conn, tlsConfig)
				if err := tlsConn.Handshake(); err != nil {
					conn.Close()
					return nil, fmt.Errorf("inner TLS handshake failed: %v", err)
				}
				fmt.Printf("[DEBUG] Inner TLS handshake completed for %s\n", addr)
				return tlsConn, nil
			}
			
			return conn, nil
		},
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}

	client := &http.Client{
		Transport: transport,
		Timeout:   60 * time.Second,
	}

	fmt.Printf("[INFO] Created Trojan client for %s:%d\n", config.Host, config.Port)

	return client, nil
}

// dialTrojan 建立 Trojan 连接
func dialTrojan(config ProxyConfig, targetAddr string) (net.Conn, error) {
	// 1. 连接到 Trojan 服务器
	serverAddr := fmt.Sprintf("%s:%d", config.Host, config.Port)
	
	dialer := &net.Dialer{
		Timeout: 30 * time.Second,
	}
	
	conn, err := dialer.Dial("tcp", serverAddr)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to trojan server: %v", err)
	}

	// 2. 升级到 TLS
	tlsConfig := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         config.Host,
	}
	
	tlsConn := tls.Client(conn, tlsConfig)
	if err := tlsConn.Handshake(); err != nil {
		conn.Close()
		return nil, fmt.Errorf("TLS handshake failed: %v", err)
	}

	// 3. 发送 Trojan 请求
	// Trojan 协议格式:
	// +-----------------------+---------+----------------+---------+----------+
	// | hex(SHA224(password)) |  CRLF   | Trojan Request |  CRLF   |   Data   |
	// +-----------------------+---------+----------------+---------+----------+
	// |          56           | X'0D0A' |    Variable    | X'0D0A' | Variable |
	// +-----------------------+---------+----------------+---------+----------+

	// 计算密码的 SHA224 哈希
	hash := sha256.Sum224([]byte(config.Password))
	hexHash := hex.EncodeToString(hash[:])

	// 解析目标地址
	host, portStr, err := net.SplitHostPort(targetAddr)
	if err != nil {
		tlsConn.Close()
		return nil, fmt.Errorf("invalid target address: %v", err)
	}

	// 转换端口为 uint16
	var port uint16
	fmt.Sscanf(portStr, "%d", &port)
	portBytes := []byte{byte(port >> 8), byte(port & 0xFF)}

	// 构建 Trojan 请求
	// CMD: 0x01 (CONNECT)
	// ATYP: 0x03 (Domain name)
	// DST.ADDR: domain name
	// DST.PORT: port in network byte order
	
	var request []byte
	request = append(request, []byte(hexHash)...)
	request = append(request, '\r', '\n')
	request = append(request, 0x01) // CMD: CONNECT
	request = append(request, 0x03) // ATYP: Domain
	request = append(request, byte(len(host))) // Domain length
	request = append(request, []byte(host)...)
	request = append(request, portBytes...)
	request = append(request, '\r', '\n')

	if _, err := tlsConn.Write(request); err != nil {
		tlsConn.Close()
		return nil, fmt.Errorf("failed to send trojan request: %v", err)
	}

	fmt.Printf("[DEBUG] Trojan connection established to %s via %s\n", targetAddr, serverAddr)

	return tlsConn, nil
}

// Copy data between connections
func pipe(dst io.Writer, src io.Reader) {
	io.Copy(dst, src)
}

