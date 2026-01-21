package middleware

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"time"
)

// Response 统一响应结构
type Response struct {
	Code      int         `json:"code"`
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Details   interface{} `json:"details,omitempty"`
	Timestamp int64       `json:"timestamp"`
	RequestID string      `json:"requestId"`
}

// ResponseMiddleware 统一响应中间件
func ResponseMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}

// Success 成功响应
func Success(c *gin.Context, data interface{}, message string) {
	requestID := c.GetString("requestId")
	if requestID == "" {
		requestID = "unknown"
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.Header("X-Powered-By", "GitNetDisk")
	c.Header("X-Response-Time", time.Now().String())
	c.Header("X-Request-Id", requestID)

	c.JSON(http.StatusOK, Response{
		Code:      http.StatusOK,
		Success:   true,
		Message:   message,
		Data:      data,
		Timestamp: time.Now().Unix(),
		RequestID: requestID,
	})
}

// Error 错误响应
func Error(c *gin.Context, code int, message string, details interface{}) {
	requestID := c.GetString("requestId")
	if requestID == "" {
		requestID = "unknown"
	}

	c.Header("Content-Type", "application/json; charset=utf-8")
	c.Header("X-Powered-By", "GitNetDisk")
	c.Header("X-Response-Time", time.Now().String())
	c.Header("X-Request-Id", requestID)

	c.JSON(code, Response{
		Code:      code,
		Success:   false,
		Message:   message,
		Details:   details,
		Timestamp: time.Now().Unix(),
		RequestID: requestID,
	})
}
