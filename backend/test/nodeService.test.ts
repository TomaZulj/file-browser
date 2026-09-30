import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { ConflictError, NotFoundError, ValidationError } from '../src/errors.ts';
import { NodeService } from '../src/services/nodeService.ts';
import { InMemoryNodeRepository } from './helpers/inMemoryNodeRepository.ts';

describe('NodeService', () => {
  let service: NodeService;

  beforeEach(() => {
    service = new NodeService(new InMemoryNodeRepository());
  });

  it('creates nested folders and lists them by parent', async () => {
    const docs = await service.create({ name: 'docs', type: 'folder' });
    const nested = await service.create({ name: 'nested', type: 'folder', parentId: docs.id });

    assert.deepEqual(await service.listChildren(), [docs]);
    assert.deepEqual(await service.listChildren(docs.id), [nested]);
  });

  it('rejects a missing parent', async () => {
    await assert.rejects(
      service.create({ name: 'a.txt', type: 'file', parentId: crypto.randomUUID() }),
      NotFoundError,
    );
  });

  it('rejects a file as parent', async () => {
    const file = await service.create({ name: 'a.txt', type: 'file' });

    await assert.rejects(
      service.create({ name: 'b.txt', type: 'file', parentId: file.id }),
      ValidationError,
    );
  });

  it('rejects duplicate names in the same folder', async () => {
    await service.create({ name: 'a.txt', type: 'file' });

    await assert.rejects(service.create({ name: 'A.txt', type: 'file' }), ConflictError);
  });

  it('deletes a folder together with its contents', async () => {
    const folder = await service.create({ name: 'docs', type: 'folder' });
    await service.create({ name: 'a.txt', type: 'file', parentId: folder.id });

    await service.delete(folder.id);

    assert.deepEqual(await service.listChildren(), []);
    assert.deepEqual(await service.findFilesByName('a.txt'), []);
  });

  it('fails to delete an unknown node', async () => {
    await assert.rejects(service.delete(crypto.randomUUID()), NotFoundError);
  });

  it('finds files by exact name in one folder or everywhere', async () => {
    const folder = await service.create({ name: 'docs', type: 'folder' });
    const inFolder = await service.create({ name: 'a.txt', type: 'file', parentId: folder.id });
    await service.create({ name: 'a.txt', type: 'file' });

    assert.deepEqual(await service.findFilesByName('a.txt', folder.id), [inFolder]);
    assert.equal((await service.findFilesByName('a.txt')).length, 2);
    assert.deepEqual(await service.findFilesByName('a'), []);
  });

  it('suggests at most 10 files starting with the prefix, ignoring folders', async () => {
    await service.create({ name: 'report', type: 'folder' });
    await service.create({ name: 'other.txt', type: 'file' });
    for (let i = 0; i < 12; i++) {
      await service.create({ name: `Report-${String(i).padStart(2, '0')}.txt`, type: 'file' });
    }

    const suggestions = await service.suggestFiles('report');

    assert.equal(suggestions.length, 10);
    assert.equal(suggestions[0].name, 'Report-00.txt');
    assert.ok(suggestions.every((node) => node.type === 'file'));
  });
});
