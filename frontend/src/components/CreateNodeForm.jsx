import { useState } from 'react';

export function CreateNodeForm({ onCreate }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('folder');

  async function handleSubmit(event) {
    event.preventDefault();
    if (await onCreate({ name, type })) {
      setName('');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <select value={type} onChange={(event) => setType(event.target.value)}>
        <option value="folder">Folder</option>
        <option value="file">File</option>
      </select>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" required />
      <button type="submit">Create</button>
    </form>
  );
}
