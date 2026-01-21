import { FileItem, FileType, Repository, User } from '../types';

// Mock Data
const MOCK_USER: User = {
  id: '1',
  username: '极客小王',
  avatarUrl: 'https://picsum.photos/200',
};

const MOCK_REPOS: Repository[] = [
  { id: '1', name: 'finance-algorithm-pro', description: '高频交易机器人核心逻辑', updatedAt: '2 分钟前', isPrivate: true, language: 'Python', htmlUrl: 'https://github.com/mock/finance-algorithm-pro' },
  { id: '2', name: 'luxury-ui-kit', description: '高端 Web 体验 React 组件库', updatedAt: '1 小时前', isPrivate: false, language: 'TypeScript', htmlUrl: 'https://github.com/mock/luxury-ui-kit' },
  { id: '3', name: 'personal-vault', description: '个人加密文档保险箱', updatedAt: '2 天前', isPrivate: true, language: 'Markdown', htmlUrl: 'https://github.com/mock/personal-vault' },
  { id: '4', name: 'git-net-disk', description: '本应用源代码仓库', updatedAt: '5 天前', isPrivate: false, language: 'TypeScript', htmlUrl: 'https://github.com/mock/git-net-disk' },
  { id: '5', name: 'legacy-systems', description: '旧版 COBOL 主机接口系统', updatedAt: '1 周前', isPrivate: true, language: 'COBOL', htmlUrl: 'https://github.com/mock/legacy-systems' },
];

const MOCK_FILES: Record<string, FileItem[]> = {
  'root': [
    { id: 'f1', name: 'src', type: FileType.FOLDER, updatedAt: '10 分钟前' },
    { id: 'f2', name: 'public', type: FileType.FOLDER, updatedAt: '1 小时前' },
    { id: 'f_img_1', name: 'design-system.png', type: FileType.FILE, size: '2.4 MB', updatedAt: '10 分钟前' },
    { id: 'f3', name: 'README.md', type: FileType.FILE, size: '2.4 KB', updatedAt: '2 天前' },
    { id: 'f4', name: 'package.json', type: FileType.FILE, size: '1.2 KB', updatedAt: '1 天前' },
    { id: 'f5', name: 'tsconfig.json', type: FileType.FILE, size: '4.5 KB', updatedAt: '3 天前' },
  ],
  'src': [
    { id: 'f6', name: 'components', type: FileType.FOLDER, updatedAt: '2 分钟前' },
    { id: 'f7', name: 'App.tsx', type: FileType.FILE, size: '12 KB', updatedAt: '5 分钟前' },
    { id: 'f8', name: 'index.tsx', type: FileType.FILE, size: '2 KB', updatedAt: '1 小时前' },
  ],
  'components': [
    { id: 'f9', name: 'Button.tsx', type: FileType.FILE, size: '3 KB', updatedAt: '1 天前' },
    { id: 'f10', name: 'Sidebar.tsx', type: FileType.FILE, size: '5 KB', updatedAt: '2 天前' },
  ],
  'public': [
    { id: 'p1', name: 'favicon.ico', type: FileType.FILE, size: '5 KB', updatedAt: '5 天前' },
    { id: 'p2', name: 'hero-banner.jpg', type: FileType.FILE, size: '1.8 MB', updatedAt: '2 天前' },
    { id: 'p3', name: 'logo.svg', type: FileType.FILE, size: '12 KB', updatedAt: '1 周前' },
  ]
};

// Simulated API Calls
export const mockLogin = async (): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_USER), 1500);
  });
};

export const fetchRepos = async (): Promise<Repository[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_REPOS), 800);
  });
};

export const fetchFiles = async (repoId: string, path: string[]): Promise<FileItem[]> => {
  return new Promise((resolve) => {
    // Simple mock logic: if path ends in 'src', show src files, if 'components', show components, else root
    const key = path.length > 0 ? path[path.length - 1] : 'root';
    setTimeout(() => resolve(MOCK_FILES[key] || []), 600);
  });
};