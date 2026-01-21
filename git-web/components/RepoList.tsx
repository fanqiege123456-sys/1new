import React, { useState } from 'react';
import { Repository } from '../types';
import { Icons } from './Icons';

interface RepoListProps {
  repos: Repository[];
  selectedRepo: Repository | null;
  onSelectRepo: (repo: Repository) => void;
  onNewRepo: () => void;
}

const RepoList: React.FC<RepoListProps> = ({ repos, selectedRepo, onSelectRepo, onNewRepo }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full glass-panel w-full md:w-80 relative z-10 rounded-3xl overflow-hidden shadow-glass">
      {/* Header */}
      <div className="p-6 pb-4 flex justify-between items-center bg-white/30 backdrop-blur-md">
        <h2 className="text-slate-800 font-bold text-lg tracking-tight">我的仓库</h2>
        <button 
          onClick={onNewRepo}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-slate-500 hover:text-blue-600 hover:shadow-md transition-all border border-white/50"
          title="新建仓库"
        >
          <Icons.Plus size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="px-5 pb-4">
        <div className="relative group">
          <Icons.Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="搜索仓库..." 
            className="w-full input-inset rounded-xl pl-10 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
        {filteredRepos.map(repo => (
          <div 
            key={repo.id}
            onClick={() => onSelectRepo(repo)}
            className={`
              p-3.5 rounded-xl cursor-pointer transition-all duration-200 border
              ${selectedRepo?.id === repo.id 
                ? 'bg-white shadow-md border-white/80 scale-[1.02] z-10' 
                : 'bg-transparent border-transparent hover:bg-white/40 hover:border-white/40 text-slate-500'}
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-semibold truncate ${selectedRepo?.id === repo.id ? 'text-blue-600' : 'text-slate-700'}`}>
                {repo.name}
              </span>
              {repo.isPrivate && (
                <Icons.Lock size={12} className="text-slate-400" />
              )}
            </div>
            <p className="text-xs text-slate-500 truncate mb-2.5 opacity-80">{repo.description}</p>
            <div className="flex items-center text-[10px] text-slate-400 space-x-2">
              <span className="flex items-center px-1.5 py-0.5 rounded-md bg-slate-100/50">
                 <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5"></span>
                 {repo.language}
              </span>
              <span>{repo.updatedAt}</span>
            </div>
          </div>
        ))}
        
        {/* Empty State */}
        {filteredRepos.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
             未找到仓库
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoList;