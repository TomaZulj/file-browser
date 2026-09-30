import type { FileSystemNode } from '../api/types.ts';

interface BreadcrumbsProps {
  path: FileSystemNode[];
  onNavigate: (depth: number) => void;
}

export function Breadcrumbs({ path, onNavigate }: BreadcrumbsProps) {
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
