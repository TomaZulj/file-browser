import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { Icon } from './Icon.jsx';

const DEBOUNCE_MS = 250;

export function SearchBox({ onError }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState(null);
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);

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

  async function search(name) {
    setQuery(name);
    setSuggestions([]);
    try {
      setResults(await api.searchFiles(name));
    } catch (error) {
      onError(error);
    }
  }

  return (
    <section className="search">
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
          placeholder="Search files"
        />
        <button className="primary" type="submit">
          Find exact name
        </button>
      </form>
      {suggestions.length > 0 && (
        <ul className="card list suggestions">
          {suggestions.map((file) => (
            <li key={file.id}>
              <button className="node-name folder" onClick={() => search(file.name)}>
                <Icon type="file" />
                {file.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {results && (
        <p className="muted">
          {results.length} file(s) named "{query}"
        </p>
      )}
    </section>
  );
}
