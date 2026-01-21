
export interface User {
  id: string;
  username: string;
  avatarUrl: string;
}

export interface Repository {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  isPrivate: boolean;
  language: string;
  htmlUrl: string; // Add URL field
}

export enum FileType {
  FILE = 'file',
  FOLDER = 'folder'
}

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size?: string;
  updatedAt: string;
}

export type ViewState = 'login' | 'dashboard';
export type ModalState = 'none' | 'settings' | 'create-repo' | 'share-repo';
