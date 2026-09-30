import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app.js';
import { NodeService } from '../src/services/nodeService.js';
import { InMemoryNodeRepository } from './helpers/inMemoryNodeRepository.js';

describe('HTTP API', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = createApp(new NodeService(new InMemoryNodeRepository()));
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://localhost:${server.address().port}`;
  });

  after(() => server.close());

  const request = (path, options = {}) =>
    fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json' },
    });

  const post = (body) => request('/api/nodes', { method: 'POST', body: JSON.stringify(body) });

  it('creates a folder and a file inside it, then finds the file', async () => {
    const folderResponse = await post({ name: 'docs', type: 'folder' });
    const folder = await folderResponse.json();
    assert.equal(folderResponse.status, 201);
    assert.equal(folderResponse.headers.get('location'), `/api/nodes/${folder.id}`);

    const fileResponse = await post({ name: 'cv.pdf', type: 'file', parentId: folder.id });
    assert.equal(fileResponse.status, 201);

    const children = await (await request(`/api/nodes?parentId=${folder.id}`)).json();
    assert.deepEqual(children.map((node) => node.name), ['cv.pdf']);

    const search = await (await request(`/api/files/search?name=cv.pdf&parentId=${folder.id}`)).json();
    assert.equal(search.length, 1);

    const suggestions = await (await request('/api/files/suggestions?prefix=cv')).json();
    assert.equal(suggestions.length, 1);
  });

  it('deletes a node with 204 and then returns 404', async () => {
    const node = await (await post({ name: 'tmp', type: 'folder' })).json();

    const first = await request(`/api/nodes/${node.id}`, { method: 'DELETE' });
    const second = await request(`/api/nodes/${node.id}`, { method: 'DELETE' });

    assert.equal(first.status, 204);
    assert.equal(second.status, 404);
  });

  it('returns 409 for a duplicate name', async () => {
    await post({ name: 'dup.txt', type: 'file' });

    const response = await post({ name: 'dup.txt', type: 'file' });

    assert.equal(response.status, 409);
  });

  it('returns 400 for invalid input', async () => {
    const invalidName = await post({ name: 'a/b', type: 'file' });
    const invalidType = await post({ name: 'x', type: 'shortcut' });
    const invalidId = await request('/api/nodes/not-a-uuid', { method: 'DELETE' });
    const missingPrefix = await request('/api/files/suggestions');

    for (const response of [invalidName, invalidType, invalidId, missingPrefix]) {
      assert.equal(response.status, 400);
      assert.ok((await response.json()).error);
    }
  });
});
