export type NodeType = 'file' | 'folder';

export interface FileSystemNode {
  id: string;
  parentId: string | null;
  name: string;
  type: NodeType;
  createdAt: string;
}

export interface NewNode {
  name: string;
  type: NodeType;
  parentId?: string;
}
