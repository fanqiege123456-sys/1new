package github

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"git-net-disk/internal/proxy"
)

// Client GitHub API 客户端
type Client struct {
	Client  *http.Client
	token   string
	baseURL string
}

// Repository GitHub 仓库信息
type Repository struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	FullName    string    `json:"full_name"`
	Description string    `json:"description"`
	Private     bool      `json:"private"`
	Owner       Owner     `json:"owner"`
	HTMLURL     string    `json:"html_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Size        int       `json:"size"`
}

// Owner 仓库所有者信息
type Owner struct {
	Login     string `json:"login"`
	ID        int64  `json:"id"`
	AvatarURL string `json:"avatar_url"`
}

// FileEntry 文件条目信息
type FileEntry struct {
	Name        string    `json:"name"`
	Path        string    `json:"path"`
	SHA         string    `json:"sha"`
	Size        int       `json:"size"`
	URL         string    `json:"url"`
	HTMLURL     string    `json:"html_url"`
	GitURL      string    `json:"git_url"`
	DownloadURL string    `json:"download_url"`
	Type        string    `json:"type"` // file 或 dir
	Content     string    `json:"content,omitempty"`
	Encoding    string    `json:"encoding,omitempty"`
	LastCommit  Commit    `json:"last_commit,omitempty"`
}

// Commit 提交信息
type Commit struct {
	SHA    string    `json:"sha"`
	Commit struct {
		Author struct {
			Name  string    `json:"name"`
			Email string    `json:"email"`
			Date  time.Time `json:"date"`
		} `json:"author"`
		Message string `json:"message"`
	} `json:"commit"`
}

// CreateFileRequest 创建文件请求
type CreateFileRequest struct {
	Message   string `json:"message"`
	Content   string `json:"content"`
	SHA       string `json:"sha,omitempty"`
	Branch    string `json:"branch,omitempty"`
	Committer *Committer `json:"committer,omitempty"`
}

// Committer 提交者信息
type Committer struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// NewClient 创建新的 GitHub API 客户端
func NewClient(token string, proxyConfig proxy.ProxyConfig) (*Client, error) {
	client, err := proxy.NewHTTPClient(proxyConfig)
	if err != nil {
		return nil, err
	}

	return &Client{
		Client:  client,
		token:   token,
		baseURL: "https://api.github.com",
	}, nil
}

// ListRepositories 列出用户的仓库
func (c *Client) ListRepositories() ([]Repository, error) {
	url := fmt.Sprintf("%s/user/repos", c.baseURL)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	c.setRequestHeaders(req)

	resp, err := c.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.handleError(resp)
	}

	var repositories []Repository
	if err := json.NewDecoder(resp.Body).Decode(&repositories); err != nil {
		return nil, err
	}

	return repositories, nil
}

// ListFiles 列出仓库中的文件
func (c *Client) ListFiles(owner, repo, path string) ([]FileEntry, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/contents/%s", c.baseURL, owner, repo, path)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	c.setRequestHeaders(req)

	resp, err := c.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.handleError(resp)
	}

	var files []FileEntry
	if err := json.NewDecoder(resp.Body).Decode(&files); err != nil {
		return nil, err
	}

	return files, nil
}

// GetFileContent 获取文件内容
func (c *Client) GetFileContent(owner, repo, path string) (*FileEntry, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/contents/%s", c.baseURL, owner, repo, path)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	c.setRequestHeaders(req)

	resp, err := c.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.handleError(resp)
	}

	var file FileEntry
	if err := json.NewDecoder(resp.Body).Decode(&file); err != nil {
		return nil, err
	}

	return &file, nil
}

// CreateOrUpdateFile 创建或更新文件
func (c *Client) CreateOrUpdateFile(owner, repo, path, content, message, branch string) (*FileEntry, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/contents/%s", c.baseURL, owner, repo, path)
	
	// 前端已经发送了 base64 编码的内容，直接使用
	// 不需要再次编码
	fmt.Printf("[DEBUG] CreateOrUpdateFile - owner: %s, repo: %s, path: %s\n", owner, repo, path)
	fmt.Printf("[DEBUG] Content length: %d bytes\n", len(content))

	requestBody := CreateFileRequest{
		Message: message,
		Content: content, // 直接使用前端传来的 base64 内容
		Branch:  branch,
	}

	body, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("PUT", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	c.setRequestHeaders(req)

	resp, err := c.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, c.handleError(resp)
	}

	var result struct {
		Content FileEntry `json:"content"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result.Content, nil
}

// DeleteFile 删除文件
func (c *Client) DeleteFile(owner, repo, path, sha, message, branch string) error {
	url := fmt.Sprintf("%s/repos/%s/%s/contents/%s", c.baseURL, owner, repo, path)

	requestBody := struct {
		Message string `json:"message"`
		SHA     string `json:"sha"`
		Branch  string `json:"branch,omitempty"`
	}{
		Message: message,
		SHA:     sha,
		Branch:  branch,
	}

	body, err := json.Marshal(requestBody)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("DELETE", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	c.setRequestHeaders(req)

	resp, err := c.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return c.handleError(resp)
	}

	return nil
}

// CreateRepository 创建新仓库
func (c *Client) CreateRepository(name, description string, isPrivate, autoInit bool) (*Repository, error) {
	url := fmt.Sprintf("%s/user/repos", c.baseURL)

	requestBody := struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Private     bool   `json:"private"`
		AutoInit    bool   `json:"auto_init"`
	}{
		Name:        name,
		Description: description,
		Private:     isPrivate,
		AutoInit:    autoInit,
	}

	body, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	c.setRequestHeaders(req)

	resp, err := c.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return nil, c.handleError(resp)
	}

	var repo Repository
	if err := json.NewDecoder(resp.Body).Decode(&repo); err != nil {
		return nil, err
	}

	return &repo, nil
}

// setRequestHeaders 设置请求头
func (c *Client) setRequestHeaders(req *http.Request) {
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "GitNetDisk")
	if c.token != "" {
		authHeader := fmt.Sprintf("token %s", c.token)
		req.Header.Set("Authorization", authHeader)
		// 调试日志：查看发送给GitHub的Authorization头
		fmt.Printf("[DEBUG] Sending Authorization header to GitHub: %s\n", authHeader)
	}
}

// handleError 处理错误响应
func (c *Client) handleError(resp *http.Response) error {
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("HTTP error: %s", resp.Status)
	}

	var errorResponse struct {
		Message string `json:"message"`
		Errors  []struct {
			Resource string `json:"resource"`
			Field    string `json:"field"`
			Code     string `json:"code"`
			Message  string `json:"message"`
		} `json:"errors"`
		DocumentationURL string `json:"documentation_url"`
	}

	if err := json.Unmarshal(body, &errorResponse); err != nil {
		return fmt.Errorf("HTTP error: %s - %s", resp.Status, string(body))
	}

	// 构建详细的错误信息
	if errorResponse.Message != "" {
		errMsg := fmt.Sprintf("GitHub API error: %s", errorResponse.Message)
		
		// 添加详细错误信息
		if len(errorResponse.Errors) > 0 {
			errMsg += " - Details: "
			for i, e := range errorResponse.Errors {
				if i > 0 {
					errMsg += "; "
				}
				if e.Message != "" {
					errMsg += e.Message
				} else {
					errMsg += fmt.Sprintf("%s.%s: %s", e.Resource, e.Field, e.Code)
				}
			}
		}
		
		// 打印完整错误信息用于调试
		fmt.Printf("[ERROR] GitHub API Error: %s\n", errMsg)
		if errorResponse.DocumentationURL != "" {
			fmt.Printf("[ERROR] Documentation: %s\n", errorResponse.DocumentationURL)
		}
		fmt.Printf("[ERROR] Response Body: %s\n", string(body))
		
		return fmt.Errorf("%s", errMsg)
	}

	return fmt.Errorf("HTTP error: %s", resp.Status)
}

// ParseRepoPath 解析仓库路径
func ParseRepoPath(repoPath string) (owner, repo string) {
	parts := strings.Split(strings.Trim(repoPath, "/"), "/")
	if len(parts) >= 2 {
		return parts[0], parts[1]
	}
	return "", ""
}

// ParseFilePath 解析文件路径
func ParseFilePath(filePath string) (owner, repo, path string) {
	parts := strings.Split(strings.Trim(filePath, "/"), "/")
	if len(parts) >= 3 {
		owner = parts[0]
		repo = parts[1]
		path = strings.Join(parts[2:], "/")
		return owner, repo, path
	}
	return "", "", ""
}
