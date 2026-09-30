import { useCallback, useEffect, useState } from 'react';
import { api } from './api/client.ts';
import type { FileSystemNode, NodeType } from './api/types.ts';
import { Breadcrumbs } from './components/Breadcrumbs.tsx';
import { CreateNodeForm } from './components/CreateNodeForm.tsx';
import { NodeList } from './components/NodeList.tsx';
import { SearchBox } from './components/SearchBox.tsx';

export function App() {
  const [path, setPath] = useState<FileSystemNode[]>([]);
  const [nodes, setNodes] = useState<FileSystemNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const currentFolder = path.at(-1);

  const showError = useCallback(
    (cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unexpected error'),
    [],
  );

  const reload = useCallback(async () => {
    try {
      setNodes(await api.listNodes(currentFolder?.id));
      setError(null);
    } catch (cause) {
      showError(cause);
    }
  }, [currentFolder?.id, showError]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function mutate(action: () => Promise<unknown>) {
    try {
      await action();
      await reload();
      return true;
    } catch (cause) {
      showError(cause);
      return false;
    }
  }

  const createNode = (node: { name: string; type: NodeType }) => mutate(() => api.createNode({ ...node, parentId: currentFolder?.id }));
  const deleteNode = (node: FileSystemNode) => mutate(() => api.deleteNode(node.id));

  return (
    <main className="app">
      <h1>File browser</h1>
      <SearchBox onError={showError} />
      {error && <p className="error" role="alert">{error}</p>}
      <Breadcrumbs path={path} onNavigate={(depth) => setPath(path.slice(0, depth))} />
      <CreateNodeForm onCreate={createNode} />
      <NodeList nodes={nodes} onOpen={(folder) => setPath([...path, folder])} onDelete={deleteNode} />
    </main>
  );
}
