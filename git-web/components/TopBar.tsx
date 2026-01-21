import React from 'react';
import { User } from '../types';
import { Icons } from './Icons';

interface TopBarProps {
  user: User | null;
  onOpenSettings: () => void;
  onLogout: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ user, onOpenSettings, onLogout }) => {
  return (
    <div className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-20">
      <div className="glass-panel px-4 py-2 md:px-6 rounded-2xl flex items-center space-x-2 md:space-x-3 shadow-glass-sm">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg text-white shadow-md">
           <Icons.Github size={20} />
        </div>
        <h1 className="text-lg md:text-xl font-bold text-slate-700 tracking-wide">
          <span className="hidden md:inline">GitNetDisk</span>
          <span className="md:hidden">GND</span>
        </h1>
      </div>

      {user && (
        <div className="glass-panel px-3 md:px-4 py-2 rounded-2xl flex items-center space-x-2 md:space-x-4 shadow-glass-sm">
          <div className="flex items-center space-x-2 md:space-x-3 md:pr-2">
            <img 
              src={user.avatarUrl} 
              alt={user.username} 
              className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-white shadow-sm"
            />
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">{user.username}</span>
          </div>
          
          <div className="h-5 md:h-6 w-px bg-slate-200"></div>

          <button 
            onClick={onOpenSettings}
            className="p-1.5 md:p-2 text-slate-500 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
            title="设置"
          >
            <Icons.Settings size={20} />
          </button>
           <button 
            onClick={onLogout}
            className="p-1.5 md:p-2 text-slate-500 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
            title="退出登录"
          >
            <Icons.LogOut size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TopBar;