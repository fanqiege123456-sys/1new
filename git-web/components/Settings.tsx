import React, { useState, useEffect } from 'react';
import Button from './Button';
import { Icons } from './Icons';
import { User } from '../types';
import { githubService } from '../services/githubService';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  user: User | null;
}

type TabType = 'general' | 'profile' | 'about';

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, currentTheme, onThemeChange, user }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [backendUrl, setBackendUrl] = useState('http://localhost:3000');
  const [useBackend, setUseBackend] = useState(true);
  const [proxyUrl, setProxyUrl] = useState('');
  const [useProxy, setUseProxy] = useState(false);
  
  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const storedBackendUrl = localStorage.getItem('gitnetdisk_backend_url');
      const storedUseBackend = localStorage.getItem('gitnetdisk_use_backend') !== 'false';
      const storedProxyUrl = localStorage.getItem('gitnetdisk_proxy_url') || '';
      const storedUseProxy = localStorage.getItem('gitnetdisk_use_proxy') === 'true';
      
      if (storedBackendUrl) {
        setBackendUrl(storedBackendUrl);
      }
      setUseBackend(storedUseBackend);
      setProxyUrl(storedProxyUrl);
      setUseProxy(storedUseProxy);
    }
  }, [isOpen]);
  
  const handleSave = () => {
    // Save Backend Settings
    const cleanUrl = backendUrl.trim();
    
    if (cleanUrl) {
      localStorage.setItem('gitnetdisk_backend_url', cleanUrl);
      githubService.setBackendUrl(cleanUrl);
    } else {
      localStorage.removeItem('gitnetdisk_backend_url');
      githubService.setBackendUrl(null);
    }
    
    // Save use backend preference
    localStorage.setItem('gitnetdisk_use_backend', String(useBackend));
    githubService.setUseBackend(useBackend);
    
    // Save proxy settings
    const cleanProxyUrl = proxyUrl.trim();
    if (cleanProxyUrl) {
      localStorage.setItem('gitnetdisk_proxy_url', cleanProxyUrl);
    } else {
      localStorage.removeItem('gitnetdisk_proxy_url');
    }
    localStorage.setItem('gitnetdisk_use_proxy', String(useProxy));
    
    alert('设置已保存！\n\n注意：代理设置需要重新登录后生效。');
    onClose();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: '通用设置', icon: <Icons.Settings size={18} /> },
    { id: 'profile', label: '账号信息', icon: <Icons.User size={18} /> },
    { id: 'about', label: '关于', icon: <Icons.Info size={18} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-4xl h-[600px] rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col md:flex-row">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/20 p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-6 px-2 hidden md:block" style={{ color: 'var(--text-primary)' }}>设置</h2>
          <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-visible">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-white/50 shadow-sm text-blue-600 border border-white/60' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/30 border border-transparent'}
                `}
                style={{
                    color: activeTab === tab.id ? '#3b82f6' : 'var(--text-secondary)'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent relative">
          {/* Header (Mobile Close) */}
          <div className="absolute top-4 right-4 z-10">
            <button onClick={onClose} className="p-2 transition-colors rounded-full hover:bg-white/30" style={{ color: 'var(--text-secondary)' }}>
              <Icons.X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeTab === 'general' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                    <Icons.Palette className="mr-2 text-purple-500" size={20} />
                    外观风格
                  </h3>
                  <div className="glass-panel rounded-2xl p-6 shadow-sm grid grid-cols-2 gap-4">
                     <div 
                        onClick={() => onThemeChange('light')}
                        className={`h-24 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center text-sm font-medium transition-all
                            ${currentTheme === 'light' ? 'border-blue-500 bg-white/80' : 'border-transparent bg-gray-100/50 hover:bg-gray-100'}
                        `}
                        style={{ color: '#334155' }}
                     >
                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-white shadow-sm mb-2"></div>
                         简约白 (Light)
                     </div>
                     <div 
                        onClick={() => onThemeChange('dark')}
                        className={`h-24 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center text-sm font-medium transition-all
                            ${currentTheme === 'dark' ? 'border-blue-500 bg-slate-800' : 'border-transparent bg-slate-800/50 hover:bg-slate-800'}
                        `}
                        style={{ color: currentTheme === 'dark' ? 'white' : '#94a3b8' }}
                     >
                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 shadow-sm mb-2"></div>
                         暗夜黑 (Dark)
                     </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                    <Icons.Server className="mr-2 text-blue-500" size={20} />
                    后端服务配置
                  </h3>
                  <div className="glass-panel rounded-2xl p-6 shadow-sm space-y-4">
                    {/* 是否启用后端服务 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          使用后端服务
                        </label>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          通过后端服务访问 GitHub API（推荐）
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={useBackend}
                          onChange={(e) => setUseBackend(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* 后端URL配置 */}
                    {useBackend && (
                      <div className="animate-fade-in">
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          后端服务地址
                        </label>
                        <input 
                          type="text" 
                          value={backendUrl}
                          onChange={(e) => setBackendUrl(e.target.value)}
                          placeholder="http://localhost:3000" 
                          className="w-full input-inset rounded-xl px-4 py-2.5 outline-none transition-all placeholder-slate-400"
                          style={{ color: 'var(--text-primary)' }}
                        />
                        <div className="mt-3 space-y-1">
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            后端服务提供的 API 端点：
                          </p>
                          <ul className="text-xs space-y-1 ml-4" style={{ color: 'var(--text-secondary)' }}>
                            <li>• <span className="font-mono bg-black/5 px-1 rounded">GET /api/repos</span> - 列出仓库</li>
                            <li>• <span className="font-mono bg-black/5 px-1 rounded">GET /api/files/:owner/:repo/*path</span> - 列出文件</li>
                            <li>• <span className="font-mono bg-black/5 px-1 rounded">PUT /api/file/:owner/:repo/*path</span> - 上传文件</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {!useBackend && (
                      <div className="text-xs p-3 bg-yellow-50 border border-yellow-200 rounded-lg" style={{ color: '#92400e' }}>
                        ⚠️ 未启用后端服务时，将直接连接 GitHub API。国内用户可能需要启用后端服务以确保稳定访问。
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                    <Icons.Globe className="mr-2 text-green-500" size={20} />
                    网络代理配置
                  </h3>
                  <div className="glass-panel rounded-2xl p-6 shadow-sm space-y-4">
                    {/* 是否启用代理 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          启用网络代理
                        </label>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          后端服务将通过代理访问 GitHub API
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={useProxy}
                          onChange={(e) => setUseProxy(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* 代理URL配置 */}
                    {useProxy && (
                      <div className="animate-fade-in space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            代理服务器地址
                          </label>
                          <input 
                            type="text" 
                            value={proxyUrl}
                            onChange={(e) => setProxyUrl(e.target.value)}
                            placeholder="http://127.0.0.1:7890" 
                            className="w-full input-inset rounded-xl px-4 py-2.5 outline-none transition-all placeholder-slate-400 font-mono text-sm"
                            style={{ color: 'var(--text-primary)' }}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                            支持的代理格式：
                          </p>
                          <ul className="text-xs space-y-1 ml-4" style={{ color: 'var(--text-secondary)' }}>
                            <li>• <strong>订阅链接</strong>：<span className="font-mono bg-black/5 px-1 rounded text-[10px]">https://example.com/sub/xxx</span></li>
                            <li>• HTTP 代理：<span className="font-mono bg-black/5 px-1 rounded text-[10px]">http://127.0.0.1:7890</span></li>
                            <li>• SOCKS5 代理：<span className="font-mono bg-black/5 px-1 rounded text-[10px]">socks5://127.0.0.1:1080</span></li>
                            <li>• 带认证：<span className="font-mono bg-black/5 px-1 rounded text-[10px]">http://user:pass@127.0.0.1:7890</span></li>
                          </ul>
                        </div>

                        <div className="text-xs p-3 bg-green-50 border border-green-200 rounded-lg" style={{ color: '#065f46' }}>
                          ✨ <strong>新功能</strong>：现在支持直接使用 Clash/V2Ray 订阅链接！
                          <br/>
                          后端会自动解析订阅内容并使用其中的代理节点。
                        </div>

                        <div className="text-xs p-3 bg-blue-50 border border-blue-200 rounded-lg" style={{ color: '#1e40af' }}>
                          💡 提示：
                          <ul className="mt-2 space-y-1 ml-4">
                            <li>• 订阅链接会自动解析为可用的代理节点</li>
                            <li>• 支持 Clash YAML 格式和 Base64 编码格式</li>
                            <li>• 配置会缓存 10 分钟，避免频繁请求</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && user && (
              <div className="space-y-8 animate-fade-in">
                 <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md">
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{user.username}</h3>
                      <p className="text-sm font-medium opacity-70" style={{ color: 'var(--text-primary)' }}>GitHub 用户</p>
                    </div>
                 </div>
                 
                 <div className="glass-panel p-4 rounded-xl">
                     <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                         已通过 Personal Access Token 安全连接。
                         <br/>
                         ID: {user.id}
                     </p>
                 </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-fade-in">
                <div className="w-24 h-24 glass-panel rounded-3xl flex items-center justify-center shadow-glass">
                   <Icons.Github style={{ color: 'var(--text-primary)' }} size={48} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>GitNetDisk</h2>
                <p className="max-w-md" style={{ color: 'var(--text-secondary)' }}>
                  一个优雅的纯净版 GitHub 文件管理器。<br/>
                  无广告，无会员，只为极致体验。
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/20 bg-white/10 backdrop-blur-md flex justify-end space-x-3 rounded-br-3xl">
             <Button variant="ghost" onClick={onClose}>关闭</Button>
             {activeTab === 'general' && (
               <Button onClick={handleSave}>保存设置</Button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;