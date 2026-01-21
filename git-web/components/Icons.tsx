import { 
  Github, 
  Folder, 
  FileCode, 
  FileText, 
  File, 
  Settings, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Download, 
  Trash2, 
  ChevronRight, 
  CloudUpload, 
  LogOut,
  User,
  LayoutGrid,
  List,
  X,
  Image as ImageIcon,
  Globe,
  Lock,
  Info,
  Check,
  Edit2,
  Copy,
  Eye,
  Server,
  Palette,
  Share2,
  ExternalLink
} from 'lucide-react';
import React from 'react';

// Exporting icons directly for ease of use
export const Icons = {
  Github,
  Folder,
  FileCode,
  FileText,
  File,
  Settings,
  Search,
  Plus,
  MoreHorizontal,
  Download,
  Trash2,
  ChevronRight,
  CloudUpload,
  LogOut,
  User,
  LayoutGrid,
  List,
  X,
  Image: ImageIcon,
  Globe,
  Lock,
  Info,
  Check,
  Edit2,
  Copy,
  Eye,
  Server,
  Palette,
  Share2,
  ExternalLink
};

export const FileIcon: React.FC<{ type: string; name: string, className?: string }> = ({ type, name, className }) => {
  // Softer yellow for folders
  if (type === 'folder') return <Folder className={`text-yellow-400 fill-yellow-400/20 ${className}`} />;
  
  const ext = name.split('.').pop()?.toLowerCase();
  
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) {
    return <ImageIcon className={`text-purple-500 ${className}`} />;
  }
  
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'json'].includes(ext || '')) {
    return <FileCode className={`text-blue-500 ${className}`} />;
  }
  
  if (['md', 'txt', 'doc', 'docx'].includes(ext || '')) {
    return <FileText className={`text-slate-500 ${className}`} />;
  }
  
  return <File className={`text-slate-400 ${className}`} />;
};