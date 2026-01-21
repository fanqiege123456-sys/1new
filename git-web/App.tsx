import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import RepoList from './components/RepoList';
import FileBrowser from './components/FileBrowser';
import Settings from './components/Settings';
import CreateRepoModal from './components/CreateRepoModal';
import ShareRepoModal from './components/ShareRepoModal';
import Button from './components/Button';
import { Icons } from './components/Icons';
import { User, Repository, FileItem, ViewState, ModalState } from './types';
import { githubService } from './services/githubService';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('login');
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>('none');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Login State
  const [token, setToken] = useState('');
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Apply Theme & Backend Config
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    
    // 强制使用后端服务（因为浏览器不允许直接跨域访问 GitHub API）
    githubService.setUseBackend(true);
    githubService.setBackendUrl('http://localhost:3000');
    
    // 清除可能的旧配置
    localStorage.setItem('gitnetdisk_use_backend', 'true');
    localStorage.setItem('gitnetdisk_backend_url', 'http://localhost:3000');
  }, [theme]);

  const handleLogin = async () => {
    if (!token.trim()) {
        alert("请输入 GitHub Personal Access Token (PAT)");
        return;
    }

    setIsLoginLoading(true);
    try {
      githubService.setToken(token.trim());
      
      // 1. Get User
      const userData = await githubService.getUser();
      setUser(userData);
      
      // 2. Get Repos
      const reposData = await githubService.getRepos();
      setRepos(reposData);
      
      // On Desktop, auto-select first repo if available. On Mobile, don't.
      if (window.innerWidth >= 768 && reposData.length > 0) {
        setSelectedRepo(reposData[0]);
      }
      
      setViewState('dashboard');
    } catch (error: any) {
      console.error("Login failed", error);
      alert("登录失败: " + (error.message || "请检查Token是否正确"));
    } finally {
      setIsLoginLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRepo && viewState === 'dashboard') {
      loadFiles(selectedRepo, currentPath);
    }
  }, [selectedRepo, currentPath, viewState]);

  const loadFiles = async (repo: Repository, path: string[]) => {
    setIsFileLoading(true);
    try {
      if (!user) return;
      const data = await githubService.getFiles(user.username, repo.name, path.join('/'));
      setFiles(data);
    } catch (err) {
        console.error(err);
        setFiles([]);
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleSelectRepo = (repo: Repository) => {
    if (selectedRepo?.id !== repo.id) {
      setSelectedRepo(repo);
      setCurrentPath([]); // Reset path on repo switch
    }
  };

  const handleBackToRepos = () => {
    setSelectedRepo(null);
  };

  const handleCreateRepo = async (data: { name: string; description: string; isPrivate: boolean; initReadme: boolean }) => {
    try {
        const newRepo = await githubService.createRepo(data.name, data.description, data.isPrivate, data.initReadme);
        
        // Update list
        setRepos([newRepo, ...repos]);
        setSelectedRepo(newRepo);
        setCurrentPath([]);
        setModalState('none');
        alert("仓库创建成功！");
    } catch (err: any) {
        alert("创建失败: " + err.message);
    }
  };

  const handleRename = (fileId: string, newName: string) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === fileId ? { ...file, name: newName } : file
      )
    );
  };

  const handleUploadFiles = async (filesToUpload: { file: File, path: string }[]) => {
    if (!user || !selectedRepo) return;

    setIsFileLoading(true);
    
    try {
        const currentDir = currentPath.join('/');
        
        // 过滤掉不应该上传的文件
        const filteredFiles = filesToUpload.filter(item => {
            const path = item.path.toLowerCase();
            // 排除 .git 文件夹（GitHub 不允许）
            if (path.includes('/.git/') || path.startsWith('.git/')) {
                console.log('[SKIP] Skipping .git file:', item.path);
                return false;
            }
            return true;
        });
        
        const skippedCount = filesToUpload.length - filteredFiles.length;
        if (skippedCount > 0) {
            console.log(`[INFO] Skipped ${skippedCount} .git files`);
        }
        
        // 如果文件很多，警告用户
        if (filteredFiles.length > 500) {
            const confirm = window.confirm(
                `即将上传 ${filteredFiles.length} 个文件，这可能需要很长时间（可能数小时）。\n\n` +
                `GitHub API 有速率限制：\n` +
                `- 认证用户：5000 请求/小时\n` +
                `- 每个文件需要 1 个请求\n\n` +
                `建议：分批上传或使用 Git 命令行工具。\n\n` +
                `是否继续？`
            );
            if (!confirm) {
                setIsFileLoading(false);
                return;
            }
        }
        
        let successCount = 0;
        let failCount = 0;
        const failedFiles: string[] = [];

        console.log('[DEBUG] Current directory:', currentDir);
        console.log('[DEBUG] Total files to upload:', filteredFiles.length);

        // 显示进度
        const startTime = Date.now();
        
        // Iterate and upload
        for (let i = 0; i < filteredFiles.length; i++) {
            const item = filteredFiles[i];
            const fullPath = currentDir ? `${currentDir}/${item.path}` : item.path;
            
            // 每 50 个文件显示一次进度
            if (i % 50 === 0) {
                console.log(`[进度] ${i}/${filteredFiles.length} (${Math.round(i/filteredFiles.length*100)}%)`);
            }
            
            try {
                await githubService.uploadFile(user.username, selectedRepo.name, fullPath, item.file);
                successCount++;
            } catch (err: any) {
                console.error(`Failed to upload ${item.path}:`, err.message);
                failCount++;
                failedFiles.push(item.path);
                
                // 如果是速率限制错误，停止上传
                if (err.message && err.message.includes('rate limit')) {
                    alert(`GitHub API 速率限制！\n已上传 ${successCount} 个文件。\n请等待一小时后继续。`);
                    break;
                }
            }
        }

        const duration = Math.round((Date.now() - startTime) / 1000);
        let msg = `上传完成！\n成功: ${successCount} 个\n失败: ${failCount} 个`;
        if (skippedCount > 0) {
            msg += `\n跳过: ${skippedCount} 个 (.git 文件)`;
        }
        msg += `\n耗时: ${duration} 秒`;
        
        if (failedFiles.length > 0 && failedFiles.length <= 10) {
            msg += `\n\n失败的文件:\n${failedFiles.join('\n')}`;
        }
        
        alert(msg);

        // Refresh view
        loadFiles(selectedRepo, currentPath);

    } catch (err: any) {
        alert("上传过程出错: " + err.message);
    } finally {
        setIsFileLoading(false);
    }
  };

  // Login Screen Component
  if (viewState === 'login') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Main Card */}
        <div className="glass-panel w-full max-w-md rounded-3xl p-6 md:p-10 shadow-glass relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-blue-100 to-white rounded-3xl flex items-center justify-center shadow-lg border border-white/60 mb-6 md:mb-8 transform hover:scale-105 transition-transform duration-500">
            <Icons.Github className="text-slate-800" size={48} />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 tracking-tight">
            GitNetDisk
          </h1>
          <p className="text-slate-500 mb-8 font-light text-base md:text-lg">
            您的 GitHub 私有云盘
          </p>

          <div className="w-full space-y-4">
             <div className="text-left">
                 <label className="text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">GitHub Access Token</label>
                 <input 
                   type="password"
                   value={token}
                   onChange={(e) => setToken(e.target.value)}
                   placeholder="ghp_xxxxxxxxxxxx"
                   className="w-full mt-1 input-inset rounded-xl px-4 py-3 outline-none transition-all placeholder-slate-400 text-slate-700"
                 />
                 <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    我们需要 repo 权限来管理您的文件。
                    <a href="https://github.com/settings/tokens" target="_blank" className="text-blue-500 hover:underline ml-1">去获取 Token &rarr;</a>
                 </p>
             </div>

             <Button 
                className="w-full py-3.5 text-lg shadow-lg hover:shadow-xl mt-4" 
                icon={<Icons.Github size={20}/>}
                onClick={handleLogin}
                isLoading={isLoginLoading}
             >
                连接 GitHub
             </Button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="flex flex-col h-screen transition-colors duration-500" style={{ color: 'var(--text-primary)' }}>
      <TopBar 
        user={user} 
        onOpenSettings={() => setModalState('settings')} 
        onLogout={() => { setUser(null); setViewState('login'); setToken(''); }}
      />
      
      <div className="flex flex-1 overflow-hidden p-3 md:p-6 gap-3 md:gap-6 relative">
        
        {/* Repo List: Hidden on mobile if a repo is selected */}
        <div className={`
            flex-col h-full w-full md:w-80 flex-shrink-0 transition-all duration-300 absolute md:static inset-0 z-10
            ${selectedRepo ? 'hidden md:flex' : 'flex'}
        `}>
          <RepoList 
            repos={repos} 
            selectedRepo={selectedRepo} 
            onSelectRepo={handleSelectRepo} 
            onNewRepo={() => setModalState('create-repo')}
          />
        </div>
        
        {/* File Browser: Hidden on mobile if no repo selected */}
        {selectedRepo ? (
          <div className="flex-1 flex flex-col h-full min-w-0 z-20 bg-transparent">
             <FileBrowser 
                repo={selectedRepo} 
                path={currentPath}
                files={files}
                isLoading={isFileLoading}
                onNavigate={setCurrentPath}
                onRefresh={() => loadFiles(selectedRepo, currentPath)}
                onRename={handleRename}
                onUpload={handleUploadFiles}
                onShare={() => setModalState('share-repo')}
                onBackToRepos={handleBackToRepos}
            />
          </div>
        ) : (
          /* Desktop Placeholder */
          <div className="hidden md:flex flex-1 flex-col items-center justify-center glass-panel rounded-3xl" style={{ color: 'var(--text-secondary)' }}>
            <Icons.Github size={64} className="mb-4 opacity-10" />
            <p>请选择一个仓库开始浏览</p>
          </div>
        )}
      </div>

      <Settings 
        isOpen={modalState === 'settings'} 
        onClose={() => setModalState('none')} 
        currentTheme={theme}
        onThemeChange={setTheme}
        user={user}
      />

      <CreateRepoModal
        isOpen={modalState === 'create-repo'}
        onClose={() => setModalState('none')}
        onSubmit={handleCreateRepo}
      />

      <ShareRepoModal
        isOpen={modalState === 'share-repo'}
        onClose={() => setModalState('none')}
        repo={selectedRepo}
      />
    </div>
  );
};

export default App;