import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../src/app.ts';
import type { FileSystemNode } from '../src/types.ts';
import { NodeService } from '../src/services/nodeService.ts';
import { InMemoryNodeRepository } from './helpers/inMemoryNodeRepository.ts';

describe('HTTP API', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    const app = createApp(new NodeService(new InMemoryNodeRepository()));
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  after(() => server.close());

  const request = (path: string, options: RequestInit = {}) =>
    fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json' },
    });

  const post = (body: object) => request('/api/nodes', { method: 'POST', body: JSON.stringify(body) });

  it('creates a folder and a file inside it, then finds the file', async () => {
    const folderResponse = await post({ name: 'docs', type: 'folder' });
    const folder = await folderResponse.json();
    assert.equal(folderResponse.status, 201);
    assert.equal(folderResponse.headers.get('location'), `/api/nodes/${folder.id}`);

    const fileResponse = await post({ name: 'cv.pdf', type: 'file', parentId: folder.id });
    assert.equal(fileResponse.status, 201);

    const children: FileSystemNode[] = await (await request(`/api/nodes?parentId=${folder.id}`)).json();
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

  it('returns the folder path of a node', async () => {
    const folder = await (await post({ name: 'parent', type: 'folder' })).json();
    const file = await (await post({ name: 'x.txt', type: 'file', parentId: folder.id })).json();

    const ancestors: FileSystemNode[] = await (await request(`/api/nodes/${file.id}/ancestors`)).json();

    assert.deepEqual(ancestors.map((node) => node.name), ['parent']);
  });

  it('returns JSON errors for unknown routes and malformed bodies', async () => {
    const unknownRoute = await request('/api/nope');
    const malformedBody = await request('/api/nodes', { method: 'POST', body: '{bad' });

    for (const response of [unknownRoute, malformedBody]) {
      assert.match(response.headers.get('content-type') ?? '', /application\/json/);
      assert.ok((await response.json()).error);
    }
    assert.equal(unknownRoute.status, 404);
    assert.equal(malformedBody.status, 400);
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
