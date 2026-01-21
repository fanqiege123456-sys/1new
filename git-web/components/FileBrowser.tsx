import React, { useState, useEffect, useRef } from 'react';
import { FileItem, FileType, Repository } from '../types';
import { Icons, FileIcon } from './Icons';
import Button from './Button';

interface FileBrowserProps {
  repo: Repository;
  path: string[];
  files: FileItem[];
  isLoading: boolean;
  onNavigate: (path: string[]) => void;
  onRefresh: () => void;
  onRename?: (fileId: string, newName: string) => void;
  // Updated onUpload signature to accept raw files and their relative paths
  onUpload?: (files: { file: File, path: string }[]) => void;
  onShare?: () => void;
  onBackToRepos?: () => void;
}

const FileBrowser: React.FC<FileBrowserProps> = ({ repo, path, files, isLoading, onNavigate, onRefresh, onRename, onUpload, onShare, onBackToRepos }) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  
  // Context Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Renaming State
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeMenuId]);

  // Focus and select text when renaming starts
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      // Select filename without extension
      const lastDotIndex = renameValue.lastIndexOf('.');
      if (lastDotIndex > 0) {
        renameInputRef.current.setSelectionRange(0, lastDotIndex);
      } else {
        renameInputRef.current.select();
      }
    }
  }, [renamingId]);

  // Helper to check if file is an image
  const isImageFile = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(ext || '');
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Handle Drag & Drop Visuals
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const uploadList: { file: File, path: string }[] = [];
    
    // Check if we can use the newer API to detect folders (webkitGetAsEntry)
    if (items && items.length > 0 && typeof (items[0] as any).webkitGetAsEntry === 'function') {
       
       const readEntriesPromise = async (dirReader: any) => {
          try {
            // readEntries needs to be called repeatedly until it returns empty array
            let entries: any[] = [];
            let keepReading = true;
            while (keepReading) {
                const result = await new Promise<any[]>((resolve, reject) => {
                   dirReader.readEntries(resolve, reject);
                });
                if (result.length > 0) {
                   entries = [...entries, ...result];
                } else {
                   keepReading = false;
                }
            }
            return entries;
          } catch (err) {
            console.error("Error reading directory entries:", err);
            return [];
          }
       };

       // Recursive function to traverse directory structure
       const traverseFileTree = async (item: any, pathPrefix: string = '') => {
         if (item.isFile) {
           const file = await new Promise<File>((resolve) => item.file(resolve));
           uploadList.push({ file, path: pathPrefix + item.name });
         } else if (item.isDirectory) {
           const dirReader = item.createReader();
           const entries = await readEntriesPromise(dirReader);
           const promises = entries.map(entry => traverseFileTree(entry, pathPrefix + item.name + '/'));
           await Promise.all(promises);
         }
       };

       const rootPromises: Promise<void>[] = [];
       for (let i = 0; i < items.length; i++) {
         const item = items[i];
         const entry = (item as any).webkitGetAsEntry();
         if (entry) {
           rootPromises.push(traverseFileTree(entry));
         }
       }
       
       await Promise.all(rootPromises);
    } else {
       // Fallback for standard File API (Flat list)
       const files = e.dataTransfer.files;
       for (let i = 0; i < files.length; i++) {
         uploadList.push({ file: files[i], path: files[i].name });
       }
    }
    
    // Trigger upload call in parent
    if (onUpload && uploadList.length > 0) {
        onUpload(uploadList);
    }
  };

  const handleFileClick = (file: FileItem) => {
    // Don't navigate if clicking on the input during rename
    if (renamingId === file.id) return;

    if (file.type === FileType.FOLDER) {
      onNavigate([...path, file.name]);
    } else if (isImageFile(file.name)) {
      setPreviewFile(file);
    } else {
      const newSelection = new Set(selectedFiles);
      if (newSelection.has(file.id)) {
        newSelection.delete(file.id);
      } else {
        newSelection.add(file.id);
      }
      setSelectedFiles(newSelection);
    }
  };

  const handleMenuClick = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation(); // Prevent file selection
    setActiveMenuId(activeMenuId === fileId ? null : fileId);
  };

  const startRenaming = (e: React.MouseEvent, file: FileItem) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const submitRename = () => {
    if (renamingId && renameValue.trim() !== '') {
      onRename?.(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitRename();
    } else if (e.key === 'Escape') {
      cancelRename();
    }
    e.stopPropagation();
  };

  const navigateUp = (index: number) => {
    onNavigate(path.slice(0, index + 1));
  };

  const navigateRoot = () => {
    onNavigate([]);
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full glass-panel relative overflow-hidden rounded-3xl shadow-glass"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Overlay for Drag Drop */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-md border-4 border-dashed border-blue-400/50 rounded-3xl flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-white p-6 rounded-full shadow-xl mb-4 animate-bounce">
            <Icons.CloudUpload size={48} className="text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 drop-shadow-sm">松开以上传</h3>
          <p className="text-slate-500 mt-2 font-medium">支持文件和文件夹上传至 /{path.join('/')}</p>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/30 backdrop-blur-md animate-fade-in" onClick={() => setPreviewFile(null)}>
           <div 
             className="relative max-w-5xl w-full max-h-[90vh] glass-panel p-1 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in" 
             onClick={e => e.stopPropagation()}
           >
              <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200/50 bg-white/40">
                 <div className="flex items-center space-x-2">
                    <Icons.Image size={18} className="text-purple-500" />
                    <span className="text-slate-700 font-medium text-sm">{previewFile.name}</span>
                 </div>
                 <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500">{previewFile.size}</span>
                    <button 
                      onClick={() => setPreviewFile(null)} 
                      className="p-1 rounded-full hover:bg-white text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <Icons.X size={20}/>
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-auto flex justify-center items-center bg-slate-50 p-8">
                 <img 
                   src={`https://picsum.photos/seed/${previewFile.id}/1200/800`} 
                   alt={previewFile.name} 
                   className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg border border-white" 
                 />
              </div>
              
               <div className="px-4 py-3 border-t border-slate-200/50 bg-white/40 flex justify-end space-x-2">
                  <Button variant="secondary" className="!py-1.5 !px-3 !text-xs" icon={<Icons.Download size={14}/>}>下载</Button>
               </div>
           </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="h-16 border-b border-white/50 flex items-center justify-between px-3 md:px-6 bg-white/30 backdrop-blur-sm gap-2">
        {/* Mobile Back Button */}
        <div className="flex items-center min-w-0 flex-1 overflow-hidden">
            {onBackToRepos && (
                <button 
                    onClick={onBackToRepos}
                    className="md:hidden mr-2 p-1.5 rounded-lg text-slate-500 hover:bg-white/60 hover:text-slate-800 transition-colors"
                    title="返回仓库列表"
                >
                    <Icons.ChevronRight size={20} className="rotate-180" />
                </button>
            )}

            <div className="flex items-center text-sm overflow-x-auto no-scrollbar whitespace-nowrap mask-fade-right">
            <button 
                onClick={navigateRoot} 
                className="hover:bg-white/60 p-1.5 rounded text-blue-600 font-bold flex items-center transition-colors flex-shrink-0"
            >
                {repo.name}
            </button>
            {path.map((folder, index) => (
                <div key={`${folder}-${index}`} className="flex items-center flex-shrink-0">
                <Icons.ChevronRight size={14} className="text-slate-400 mx-1" />
                <button 
                    onClick={() => navigateUp(index)}
                    className="hover:bg-white/60 p-1.5 rounded text-slate-600 hover:text-blue-600 transition-colors"
                >
                    {folder}
                </button>
                </div>
            ))}
            </div>
        </div>

        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
           {onShare && (
             <button 
               onClick={onShare}
               className="p-1.5 md:p-1.5 rounded-xl bg-white/40 border border-white/50 text-blue-600 hover:bg-white hover:text-blue-700 hover:shadow-sm transition-all flex items-center"
               title="分享仓库"
             >
               <Icons.Share2 size={16} />
               <span className="text-xs font-medium ml-1 hidden lg:inline">分享</span>
             </button>
           )}

           <div className="bg-white/40 p-1 rounded-xl flex border border-white/50 backdrop-blur-sm">
             <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Icons.List size={16} />
             </button>
             <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Icons.LayoutGrid size={16} />
             </button>
           </div>
           
           {/* Batch Actions - Hidden on mobile unless space permits, or simplified */}
           {selectedFiles.size > 0 && (
             <div className="hidden md:flex items-center space-x-2 ml-4 animate-fade-in">
               <span className="text-xs text-slate-500 font-medium">已选 {selectedFiles.size} 项</span>
               <Button variant="secondary" className="!p-2 h-8 w-8 !rounded-lg"><Icons.Download size={14} /></Button>
               <Button variant="danger" className="!p-2 h-8 w-8 !rounded-lg"><Icons.Trash2 size={14} /></Button>
             </div>
           )}
        </div>
      </div>

      {/* File Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-blue-500/50">
             <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
             <p className="font-sans text-slate-500 font-medium">正在加载内容...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
             <div className="p-6 bg-white/40 rounded-full mb-4 shadow-inner">
               <Icons.Folder size={48} className="opacity-30" />
             </div>
             <p className="font-medium">文件夹为空</p>
             <p className="text-sm mt-2 opacity-70">拖拽文件到此处上传</p>
          </div>
        ) : (
          <>
            {/* Header for List View - Hide on Mobile */}
            {viewMode === 'list' && (
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-slate-400 border-b border-white/50 mb-2 uppercase tracking-wider">
                <div className="col-span-6">文件名</div>
                <div className="col-span-2">大小</div>
                <div className="col-span-3">修改时间</div>
                <div className="col-span-1 text-right">操作</div>
              </div>
            )}

            <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4' : 'space-y-2'}>
              {files.map(file => (
                <div 
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  className={`
                    group relative cursor-pointer rounded-xl transition-all duration-200 border
                    ${selectedFiles.has(file.id) && renamingId !== file.id
                      ? 'bg-blue-50 border-blue-200 shadow-sm' 
                      : 'border-transparent hover:bg-white/60 hover:border-white/60 hover:shadow-glass-sm'}
                    ${viewMode === 'list' 
                      ? 'flex md:grid md:grid-cols-12 gap-2 md:gap-4 items-center px-3 md:px-4 py-3' 
                      : 'flex flex-col items-center p-4 md:p-6 text-center aspect-square justify-center bg-white/20'}
                  `}
                >
                  {/* Icon & Name */}
                  <div className={`${viewMode === 'list' ? 'flex-1 md:col-span-6 flex items-center min-w-0' : 'mb-3 w-full flex flex-col items-center'}`}>
                    <FileIcon 
                      type={file.type} 
                      name={file.name} 
                      className={`${viewMode === 'list' ? 'w-8 h-8 md:w-5 md:h-5 mr-3 flex-shrink-0' : 'w-10 h-10 md:w-12 md:h-12 drop-shadow-md mb-2'} ${file.type === 'folder' ? 'text-yellow-400' : ''}`} 
                    />
                    
                    <div className="flex-1 min-w-0 text-left md:text-left w-full">
                         {renamingId === file.id ? (
                        <input 
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={submitRename}
                            onClick={(e) => e.stopPropagation()}
                            className="input-inset text-slate-700 px-2 py-1 rounded-md outline-none w-full text-sm"
                        />
                        ) : (
                        <div className="flex flex-col">
                            <span className={`truncate font-medium ${selectedFiles.has(file.id) ? 'text-blue-600' : 'text-slate-700'} ${viewMode === 'grid' ? 'text-center w-full text-sm' : 'text-sm'}`}>
                                {file.name}
                            </span>
                             {/* Mobile Subtext in List View */}
                             {viewMode === 'list' && (
                                <span className="md:hidden text-[10px] text-slate-400 mt-0.5">
                                    {file.size} · {file.updatedAt}
                                </span>
                             )}
                        </div>
                        )}
                    </div>
                  </div>

                  {/* Metadata (Desktop List View Only) */}
                  {viewMode === 'list' && (
                    <>
                      <div className="hidden md:block col-span-2 text-sm text-slate-500">{file.size || '--'}</div>
                      <div className="hidden md:block col-span-3 text-sm text-slate-500">{file.updatedAt}</div>
                      
                      {/* Action Button */}
                      <div className="ml-auto md:ml-0 md:col-span-1 text-right relative flex items-center">
                         <button 
                           onClick={(e) => handleMenuClick(e, file.id)}
                           className={`p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all ${activeMenuId === file.id ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-400 md:opacity-0 md:group-hover:opacity-100'}`}
                         >
                           <Icons.MoreHorizontal size={16} />
                         </button>
                         
                         {/* Dropdown Menu */}
                         {activeMenuId === file.id && (
                           <div className="absolute right-0 top-8 w-44 glass-panel bg-white/90 border border-white/60 rounded-xl shadow-xl py-1 z-50 overflow-hidden animate-fade-in origin-top-right">
                             <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors">
                               <Icons.Download size={14} className="mr-2" /> 下载
                             </button>
                             <button 
                               onClick={(e) => startRenaming(e, file)}
                               className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors"
                             >
                               <Icons.Edit2 size={14} className="mr-2" /> 重命名
                             </button>
                             <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors">
                               <Icons.Copy size={14} className="mr-2" /> 复制链接
                             </button>
                             <div className="h-px bg-slate-200/50 my-1"></div>
                             <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center transition-colors">
                               <Icons.Trash2 size={14} className="mr-2" /> 删除
                             </button>
                           </div>
                         )}
                      </div>
                    </>
                  )}
                  
                  {/* Grid View Menu (Simple) */}
                  {viewMode === 'grid' && (
                     <div className="absolute top-2 right-2">
                       {/* Simplified menu trigger for grid for brevity */}
                     </div>
                  )}
                  
                  {viewMode === 'grid' && (
                     <div className="text-xs text-slate-500 mt-2 h-5 w-full flex items-center justify-center font-medium opacity-80">
                        {renamingId === file.id ? (
                           <div className="w-0 h-0" /> // Hidden in metadata area, handled in main area for grid
                        ) : (
                           <span>{file.size || file.updatedAt}</span>
                        )}
                     </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FileBrowser;