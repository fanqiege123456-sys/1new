package middleware

import (
	"github.com/gin-gonic/gin"
)

// SetupMiddlewares 设置所有中间件
func SetupMiddlewares(router *gin.Engine) {
	router.Use(CORSMiddleware())
	router.Use(RequestIDMiddleware())
	router.Use(LoggerMiddleware())
	router.Use(ResponseMiddleware())
	router.Use(ErrorMiddleware())
}
