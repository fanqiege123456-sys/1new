package main

import (
	"fmt"
	"log"

	"git-net-disk/api"
)

func main() {
	// 创建服务器
	server := api.NewServer()

	// 注册路由
	if err := server.RegisterRoutes(); err != nil {
		log.Fatalf("Failed to register routes: %v", err)
	}

	// 启动服务器
	addr := ":3000"
	fmt.Printf("Server starting on %s\n", addr)
	if err := server.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
