import type { FileSystemNode } from '../api/types.ts';
import { Icon } from './Icon.tsx';

interface NodeListProps {
  nodes: FileSystemNode[];
  onOpen: (folder: FileSystemNode) => void;
  onDelete: (node: FileSystemNode) => void;
}

export function NodeList({ nodes, onOpen, onDelete }: NodeListProps) {
  if (nodes.length === 0) {
    return <p className="card muted">This folder is empty.</p>;
  }

  return (
    <ul className="card list">
      {nodes.map((node) => (
        <li key={node.id}>
          {node.type === 'folder' ? (
            <button className="node-name folder" onClick={() => onOpen(node)}>
              <Icon type="folder" />
              {node.name}
            </button>
          ) : (
            <span className="node-name">
              <Icon type="file" />
              {node.name}
            </span>
          )}
          <button className="danger" onClick={() => onDelete(node)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
