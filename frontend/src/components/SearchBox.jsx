import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';

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
    <section>
      <form
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
        <button type="submit">Find exact name</button>
      </form>
      <ul>
        {suggestions.map((file) => (
          <li key={file.id}>
            <button onClick={() => search(file.name)}>{file.name}</button>
          </li>
        ))}
      </ul>
      {results && (
        <p>
          {results.length} file(s) named "{query}"
        </p>
      )}
    </section>
  );
}
