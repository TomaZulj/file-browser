export function Breadcrumbs({ path, onNavigate }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <button className="link" onClick={() => onNavigate(0)}>
        Root
      </button>
      {path.map((folder, index) => (
        <span key={folder.id}>
          /
          <button className="link" onClick={() => onNavigate(index + 1)}>
            {folder.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
