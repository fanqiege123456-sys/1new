import { FileItem, FileType, Repository, User } from '../types';

export const githubService = {
  token: '',
  backendUrl: 'http://localhost:3000', // 后端服务地址
  useBackend: true, // 必须使用后端服务，因为浏览器不允许直接跨域访问 GitHub API

  setToken(token: string) {
    this.token = token;
  },

  setBackendUrl(url: string | null) {
    this.backendUrl = url || 'http://localhost:3000';
  },

  setUseBackend(use: boolean) {
    this.useBackend = use;
  },

  getHeaders() {
    const headers: Record<string, string> = {
      'Authorization': `token ${this.token}`,
      'Content-Type': 'application/json',
    };

    // 如果启用了代理，添加代理配置到请求头
    const useProxy = localStorage.getItem('gitnetdisk_use_proxy') === 'true';
    const proxyUrl = localStorage.getItem('gitnetdisk_proxy_url');
    
    if (useProxy && proxyUrl) {
      headers['X-Proxy-URL'] = proxyUrl;
    }

    return headers;
  },

  async getUser(): Promise<User> {
    // 用户信息直接从 GitHub API 获取（后端没有提供此接口）
    const url = 'https://api.github.com/user';
    const headers = {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
    };

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch user');
    const data = await res.json();
    return {
      id: String(data.id),
      username: data.login,
      avatarUrl: data.avatar_url,
    };
  },

  async getRepos(): Promise<Repository[]> {
    const url = this.useBackend
      ? `${this.backendUrl}/api/repos`
      : 'https://api.github.com/user/repos?sort=updated&per_page=100';
    
    const headers = this.useBackend 
      ? this.getHeaders()
      : {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        };

    console.log('Request Headers:', headers);
    console.log('Request URL:', url);

    const res = await fetch(url, { headers });
    console.log('Response Status:', res.status);
    console.log('Response Headers:', Object.fromEntries(res.headers.entries()));
    
    const responseText = await res.text();
    console.log('Response Text:', responseText);
    
    if (!res.ok) {
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`Failed to fetch repos: ${errorData.error || res.statusText}`);
      } catch (e) {
        throw new Error(`Failed to fetch repos: ${res.statusText}`);
      }
    }
    
    const response = JSON.parse(responseText);
    
    // 后端返回格式: { code, message, data }
    const data = this.useBackend ? response.data : response;
    
    return data.map((repo: any) => ({
      id: String(repo.id),
      name: repo.name,
      description: repo.description || '',
      updatedAt: new Date(repo.updated_at).toLocaleDateString(),
      isPrivate: repo.private,
      language: repo.language || 'Text',
      htmlUrl: repo.html_url,
      defaultBranch: repo.default_branch
    }));
  },

  async getFiles(owner: string, repo: string, path: string = ''): Promise<FileItem[]> {
    const url = this.useBackend
      ? `${this.backendUrl}/api/files/${owner}/${repo}/${path}`
      : `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    const headers = this.useBackend 
      ? this.getHeaders()
      : {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        };

    const res = await fetch(url, { headers });
    if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error('Failed to fetch files');
    }
    
    const response = await res.json();
    // 后端返回格式: { code, message, data }
    const data = this.useBackend ? response.data : response;
    
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: item.sha,
      name: item.name,
      type: item.type === 'dir' ? FileType.FOLDER : FileType.FILE,
      size: item.type === 'dir' ? '-' : formatSize(item.size),
      updatedAt: '-',
      path: item.path
    })).sort((a, b) => {
        if (a.type === FileType.FOLDER && b.type !== FileType.FOLDER) return -1;
        if (a.type !== FileType.FOLDER && b.type === FileType.FOLDER) return 1;
        return a.name.localeCompare(b.name);
    });
  },

  async createRepo(name: string, description: string, isPrivate: boolean, initReadme: boolean): Promise<Repository> {
    const url = this.useBackend
      ? `${this.backendUrl}/api/repos`
      : 'https://api.github.com/user/repos';
    
    const headers = this.useBackend 
      ? this.getHeaders()
      : {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: initReadme
      })
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Create repo failed');
    }
    
    const response = await res.json();
    // 后端返回格式: { code, message, data }
    const repo = this.useBackend ? response.data : response;
    
    return {
      id: String(repo.id),
      name: repo.name,
      description: repo.description || '',
      updatedAt: new Date(repo.updated_at).toLocaleDateString(),
      isPrivate: repo.private,
      language: repo.language || 'Text',
      htmlUrl: repo.html_url,
    };
  },

  async uploadFile(owner: string, repo: string, path: string, file: File, commitMessage?: string): Promise<void> {
    const content = await this.readFileAsBase64(file);
    
    // 清理路径，移除开头的斜杠
    path = path.replace(/^\/+/, '');
    
    const url = this.useBackend
      ? `${this.backendUrl}/api/file/${owner}/${repo}/${path}`
      : `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    const headers = this.useBackend 
      ? this.getHeaders()
      : {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        };

    // 直接上传，不检查文件是否存在
    // GitHub API 会自动处理创建或更新
    const body: any = {
        message: commitMessage || `Upload ${path.split('/').pop()} via GitNetDisk`,
        content: content,
    };

    // 2. PUT to create or update
    const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Failed to upload ${path}: ${res.status} ${res.statusText}`);
    }
  },

  readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove "data:*/*;base64," prefix because GitHub API expects raw base64
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }
};

// Helper for size
function formatSize(bytes: number): string {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}