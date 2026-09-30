export function NodeList({ nodes, onOpen, onDelete }) {
  if (nodes.length === 0) {
    return <p>This folder is empty.</p>;
  }

  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.id}>
          {node.type === 'folder' ? (
            <button onClick={() => onOpen(node)}>📁 {node.name}</button>
          ) : (
            <span>📄 {node.name}</span>
          )}{' '}
          <button onClick={() => onDelete(node)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
