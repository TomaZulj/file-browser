import type { FileSystemNode, NewNode } from './types.ts';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, options);
  if (!response.ok) {
    const { error } = await response.json().catch(() => ({}));
    throw new Error(error ?? `Request failed with status ${response.status}`);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

const queryString = (params: Record<string, string | undefined>): string =>
  new URLSearchParams(Object.entries(params).filter(([, value]) => value) as [string, string][]).toString();

export const api = {
  listNodes: (parentId?: string) => request<FileSystemNode[]>(`/nodes?${queryString({ parentId })}`),

  listAncestors: (id: string) => request<FileSystemNode[]>(`/nodes/${id}/ancestors`),

  createNode: (node: NewNode) =>
    request<FileSystemNode>('/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(node),
    }),

  deleteNode: (id: string) => request<void>(`/nodes/${id}`, { method: 'DELETE' }),

  searchFiles: (name: string, parentId?: string) =>
    request<FileSystemNode[]>(`/files/search?${queryString({ name, parentId })}`),

  suggestFiles: (prefix: string) =>
    request<FileSystemNode[]>(`/files/suggestions?${queryString({ prefix })}`),
};
