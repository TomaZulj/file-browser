import { useState, type SubmitEvent } from 'react';
import type { NodeType } from '../api/types.ts';

interface CreateNodeFormProps {
  onCreate: (node: { name: string; type: NodeType }) => Promise<boolean>;
}

export function CreateNodeForm({ onCreate }: CreateNodeFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<NodeType>('folder');

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await onCreate({ name, type })) {
      setName('');
    }
  }

  return (
    <form className="card toolbar" onSubmit={handleSubmit}>
      <select value={type} onChange={(event) => setType(event.target.value as NodeType)} aria-label="Type">
        <option value="folder">Folder</option>
        <option value="file">File</option>
      </select>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" required />
      <button className="primary" type="submit">
        Create
      </button>
    </form>
  );
}
