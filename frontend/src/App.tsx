import { useCallback, useEffect, useRef, useState } from 'react';
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
  const latestLoad = useRef(0);
  const currentFolder = path.at(-1);

  const showError = useCallback(
    (cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unexpected error'),
    [],
  );

  const reload = useCallback(async () => {
    const load = ++latestLoad.current;
    try {
      const loaded = await api.listNodes(currentFolder?.id);
      if (load === latestLoad.current) {
        setNodes(loaded);
        setError(null);
      }
    } catch (cause) {
      if (load === latestLoad.current) {
        showError(cause);
      }
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

  const createNode = (node: { name: string; type: NodeType }) =>
    mutate(() => api.createNode({ ...node, parentId: currentFolder?.id }));

  const deleteNode = async (node: FileSystemNode) => {
    if (node.type === 'folder' && !confirm(`Delete "${node.name}" and everything inside it?`)) {
      return;
    }
    await mutate(() => api.deleteNode(node.id));
  };

  const revealFile = async (file: FileSystemNode) => {
    try {
      setPath(await api.listAncestors(file.id));
    } catch (cause) {
      showError(cause);
    }
  };

  return (
    <main className="app">
      <h1>File browser</h1>
      <SearchBox currentFolder={currentFolder} onReveal={revealFile} onError={showError} />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <Breadcrumbs path={path} onNavigate={(depth) => setPath(path.slice(0, depth))} />
      <CreateNodeForm onCreate={createNode} />
      <NodeList nodes={nodes} onOpen={(folder) => setPath([...path, folder])} onDelete={deleteNode} />
    </main>
  );
}
