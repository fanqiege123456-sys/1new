import React, { useState } from 'react';
import Button from './Button';
import { Icons } from './Icons';

interface CreateRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; isPrivate: boolean; initReadme: boolean }) => void;
}

const CreateRepoModal: React.FC<CreateRepoModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [initReadme, setInitReadme] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('请输入仓库名称');
      return;
    }
    onSubmit({ name, description, isPrivate, initReadme });
    onClose();
    // Reset form
    setName('');
    setDescription('');
    setIsPrivate(false);
    setInitReadme(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-200/40 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-in bg-white/80">
        {/* Header */}
        <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/30">
          <h2 className="text-xl font-bold text-slate-800">新建仓库</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <Icons.X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name & Desc */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">仓库名称 <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如: awesome-project" 
                className="w-full input-inset rounded-xl p-3 text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">描述 (可选)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="这个项目是关于什么的..." 
                className="w-full input-inset rounded-xl p-3 h-24 text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-slate-400 resize-none"
              />
            </div>
          </div>

          {/* Visibility Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-3">可见性</label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setIsPrivate(false)}
                className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 flex flex-col items-center text-center space-y-2
                  ${!isPrivate ? 'bg-white shadow-md border-blue-400 text-blue-600' : 'bg-white/40 border-white/60 text-slate-500 hover:bg-white/60'}
                `}
              >
                <Icons.Globe size={24} className={!isPrivate ? 'text-blue-500' : 'text-slate-400'} />
                <span className="font-medium text-sm">公开 Public</span>
                <span className="text-xs opacity-70">互联网上的任何人都可以看到此仓库。</span>
              </div>
              <div 
                onClick={() => setIsPrivate(true)}
                className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 flex flex-col items-center text-center space-y-2
                  ${isPrivate ? 'bg-white shadow-md border-purple-400 text-purple-600' : 'bg-white/40 border-white/60 text-slate-500 hover:bg-white/60'}
                `}
              >
                <Icons.Lock size={24} className={isPrivate ? 'text-purple-500' : 'text-slate-400'} />
                <span className="font-medium text-sm">私有 Private</span>
                <span className="text-xs opacity-70">只有您指定的人可以看到此仓库。</span>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-3 pt-2">
            <button 
              onClick={() => setInitReadme(!initReadme)}
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm ${initReadme ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}`}
            >
              {initReadme && <Icons.Check size={14} className="text-white" />}
            </button>
            <span className="text-sm text-slate-600">添加一个 README 文件初始化仓库</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/30 border-t border-white/50 flex justify-end space-x-3 backdrop-blur-md">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit}>创建仓库</Button>
        </div>
      </div>
    </div>
  );
};

export default CreateRepoModal;