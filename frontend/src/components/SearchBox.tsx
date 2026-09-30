import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.ts';
import type { FileSystemNode } from '../api/types.ts';
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts';
import { Icon } from './Icon.tsx';

const DEBOUNCE_MS = 250;

type Scope = 'all' | 'folder';

interface SearchResults {
  name: string;
  files: FileSystemNode[];
}

interface SearchBoxProps {
  currentFolder?: FileSystemNode;
  onReveal: (file: FileSystemNode) => void;
  onError: (cause: unknown) => void;
}

export function SearchBox({ currentFolder, onReveal, onError }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [suggestions, setSuggestions] = useState<FileSystemNode[]>([]);
  const [results, setResults] = useState<SearchResults | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const activeScope = currentFolder ? scope : 'all';

  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([]);
      return;
    }
    let ignore = false;
    api
      .suggestFiles(debouncedQuery)
      .then((files) => !ignore && setSuggestions(files))
      .catch(onError);
    return () => {
      ignore = true;
    };
  }, [debouncedQuery, onError]);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  async function search(name: string) {
    setQuery(name);
    setSuggestions([]);
    try {
      const parentId = activeScope === 'folder' ? currentFolder?.id : undefined;
      setResults({ name, files: await api.searchFiles(name, parentId) });
    } catch (error) {
      onError(error);
    }
  }

  function reveal(file: FileSystemNode) {
    setResults(null);
    setQuery('');
    onReveal(file);
  }

  return (
    <section className="search" ref={containerRef}>
      <form
        className="card toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          search(query.trim());
        }}
      >
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setResults(null);
          }}
          onKeyDown={(event) => event.key === 'Escape' && setSuggestions([])}
          placeholder="Search files"
        />
        {currentFolder && (
          <select value={scope} onChange={(event) => setScope(event.target.value as Scope)} aria-label="Scope">
            <option value="all">All files</option>
            <option value="folder">In "{currentFolder.name}"</option>
          </select>
        )}
        <button className="primary" type="submit" disabled={!query.trim()}>
          Find exact name
        </button>
      </form>
      {suggestions.length > 0 && (
        <ul className="card list suggestions">
          {suggestions.map((file) => (
            <li key={file.id}>
              <button className="node-name clickable" onClick={() => search(file.name)}>
                <Icon type="file" />
                {file.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {results && (
        <div className="card">
          {results.files.length === 0 ? (
            <p className="muted">No files named "{results.name}"</p>
          ) : (
            <ul className="list">
              {results.files.map((file) => (
                <li key={file.id}>
                  <span className="node-name">
                    <Icon type="file" />
                    {file.name}
                  </span>
                  <button onClick={() => reveal(file)}>Show in folder</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
