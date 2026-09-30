import { useCallback, useEffect, useState } from 'react';
import { api } from './api/client.js';
import { Breadcrumbs } from './components/Breadcrumbs.jsx';
import { CreateNodeForm } from './components/CreateNodeForm.jsx';
import { NodeList } from './components/NodeList.jsx';
import { SearchBox } from './components/SearchBox.jsx';

export function App() {
  const [path, setPath] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [error, setError] = useState(null);
  const currentFolder = path.at(-1);

  const showError = useCallback((cause) => setError(cause.message), []);

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

  async function mutate(action) {
    try {
      await action();
      await reload();
      return true;
    } catch (cause) {
      showError(cause);
      return false;
    }
  }

  const createNode = (node) => mutate(() => api.createNode({ ...node, parentId: currentFolder?.id }));
  const deleteNode = (node) => mutate(() => api.deleteNode(node.id));

  return (
    <main>
      <h1>File browser</h1>
      <SearchBox onError={showError} />
      {error && <p role="alert">{error}</p>}
      <Breadcrumbs path={path} onNavigate={(depth) => setPath(path.slice(0, depth))} />
      <CreateNodeForm onCreate={createNode} />
      <NodeList nodes={nodes} onOpen={(folder) => setPath([...path, folder])} onDelete={deleteNode} />
    </main>
  );
}
