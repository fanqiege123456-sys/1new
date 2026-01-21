package middleware

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorMiddleware 错误处理中间件
func ErrorMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			requestID := c.GetString("requestId")
			if requestID == "" {
				requestID = "unknown"
			}

			err := c.Errors.Last()
			fmt.Printf("[%s] 全局错误: %v\n", requestID, err)

			Error(c, http.StatusInternalServerError, "服务器内部错误", gin.H{
				"error": err.Error(),
			})
		}
	}
}
