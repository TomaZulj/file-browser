async function request(path, options) {
  const response = await fetch(`/api${path}`, options);
  if (!response.ok) {
    const { error } = await response.json().catch(() => ({}));
    throw new Error(error ?? `Request failed with status ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

const queryString = (params) =>
  new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString();

export const api = {
  listNodes: (parentId) => request(`/nodes?${queryString({ parentId })}`),

  createNode: (node) =>
    request('/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(node),
    }),

  deleteNode: (id) => request(`/nodes/${id}`, { method: 'DELETE' }),

  searchFiles: (name) => request(`/files/search?${queryString({ name })}`),

  suggestFiles: (prefix) => request(`/files/suggestions?${queryString({ prefix })}`),
};
