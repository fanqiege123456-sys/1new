import React, { useState } from 'react';
import Button from './Button';
import { Icons } from './Icons';
import { Repository } from '../types';

interface ShareRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: Repository | null;
}

const ShareRepoModal: React.FC<ShareRepoModalProps> = ({ isOpen, onClose, repo }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !repo) return null;

  const handleCopy = () => {
    if (repo.htmlUrl) {
      navigator.clipboard.writeText(repo.htmlUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenGitHub = () => {
    if (repo.htmlUrl) {
      window.open(repo.htmlUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-in bg-white/80">
        {/* Header */}
        <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/30">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Icons.Share2 className="mr-2 text-blue-500" size={20} />
            分享仓库
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <Icons.X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="text-center">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4 shadow-inner">
                <Icons.Github size={32} className="text-slate-700" />
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-1">{repo.name}</h3>
             <p className="text-sm text-slate-500 flex items-center justify-center">
                {repo.isPrivate ? (
                    <><Icons.Lock size={12} className="mr-1" /> 私有仓库</>
                ) : (
                    <><Icons.Globe size={12} className="mr-1" /> 公开仓库</>
                )}
             </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">HTTPS 克隆/访问链接</label>
            <div className="flex rounded-xl shadow-sm">
              <input 
                type="text" 
                readOnly
                value={repo.htmlUrl || 'URL 不可用'}
                className="flex-1 input-inset rounded-l-xl px-4 py-3 text-slate-600 outline-none text-sm font-mono truncate border-r-0"
              />
              <button 
                onClick={handleCopy}
                className="bg-white border border-l-0 border-white/60 px-4 rounded-r-xl hover:bg-blue-50 transition-colors flex items-center font-medium text-sm text-blue-600 shadow-sm"
              >
                {copied ? <Icons.Check size={16} /> : <Icons.Copy size={16} />}
                <span className="ml-1">{copied ? '已复制' : '复制'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/30 border-t border-white/50 flex justify-end space-x-3 backdrop-blur-md">
          <Button variant="secondary" onClick={handleOpenGitHub} icon={<Icons.ExternalLink size={14}/>} className="flex-1">
            在 GitHub 打开
          </Button>
          <Button onClick={onClose} className="flex-1">完成</Button>
        </div>
      </div>
    </div>
  );
};

export default ShareRepoModal;