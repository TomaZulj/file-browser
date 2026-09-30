export type NodeType = 'file' | 'folder';

export interface FileSystemNode {
  id: string;
  parentId: string | null;
  name: string;
  type: NodeType;
  createdAt: Date;
}

export interface NewNode {
  name: string;
  type: NodeType;
  parentId: string | null;
}

export type CreateNodeInput = Omit<NewNode, 'parentId'> & { parentId?: string | null };

export interface NodeRepository {
  findById(id: string): Promise<FileSystemNode | null>;
  listChildren(parentId: string | null): Promise<FileSystemNode[]>;
  /** Folders above the node, ordered from the root down to its parent. */
  findAncestors(id: string): Promise<FileSystemNode[]>;
  insert(node: NewNode): Promise<FileSystemNode>;
  deleteById(id: string): Promise<boolean>;
  findFilesByName(name: string, parentId?: string): Promise<FileSystemNode[]>;
  findFilesByNamePrefix(prefix: string, limit: number): Promise<FileSystemNode[]>;
}
