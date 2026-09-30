export function Breadcrumbs({ path, onNavigate }) {
  return (
    <nav>
      <button onClick={() => onNavigate(0)}>Root</button>
      {path.map((folder, index) => (
        <span key={folder.id}>
          {' / '}
          <button onClick={() => onNavigate(index + 1)}>{folder.name}</button>
        </span>
      ))}
    </nav>
  );
}
