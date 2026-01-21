package middleware

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

// LoggerMiddleware 日志中间件
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()
		requestID := c.GetString("requestId")
		if requestID == "" {
			requestID = "unknown"
		}

		fmt.Printf("[%s] [%s] %s %s\n", 
			time.Now().Format(time.RFC3339),
			requestID,
			c.Request.Method,
			c.Request.URL.Path,
		)

		c.Next()

		endTime := time.Now()
		responseTime := endTime.Sub(startTime)
		fmt.Printf("[%s] [%s] %s %s %d %v\n", 
			endTime.Format(time.RFC3339),
			requestID,
			c.Request.Method,
			c.Request.URL.Path,
			c.Writer.Status(),
			responseTime,
		)
	}
}
