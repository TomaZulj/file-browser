import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, describe, it } from 'node:test';
import pg from 'pg';
import { createApp } from '../../src/app.ts';
import { config } from '../../src/config.ts';
import { applySchema } from '../../src/db/pool.ts';
import { PostgresNodeRepository } from '../../src/repositories/postgresNodeRepository.ts';
import { NodeService } from '../../src/services/nodeService.ts';
import type { FileSystemNode } from '../../src/types.ts';

const TEST_SCHEMA = 'integration_test';

describe('HTTP API on PostgreSQL', () => {
  let adminPool: pg.Pool;
  let pool: pg.Pool;
  let server: Server;
  let baseUrl: string;

  before(async () => {
    adminPool = new pg.Pool({ connectionString: config.databaseUrl });
    await adminPool.query(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE`);
    await adminPool.query(`CREATE SCHEMA ${TEST_SCHEMA}`);

    pool = new pg.Pool({ connectionString: config.databaseUrl, options: `-c search_path=${TEST_SCHEMA}` });
    await applySchema(pool);

    server = createApp(new NodeService(new PostgresNodeRepository(pool))).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    server.close();
    await pool.end();
    await adminPool.query(`DROP SCHEMA ${TEST_SCHEMA} CASCADE`);
    await adminPool.end();
  });

  beforeEach(() => pool.query('TRUNCATE nodes'));

  const request = (path: string, options: RequestInit = {}) =>
    fetch(`${baseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json' } });

  const create = (body: object) => request('/api/nodes', { method: 'POST', body: JSON.stringify(body) });

  const createOk = async (body: object): Promise<FileSystemNode> => {
    const response = await create(body);
    assert.equal(response.status, 201);
    return response.json();
  };

  const getJson = async (path: string): Promise<FileSystemNode[]> => (await request(path)).json();

  it('rejects duplicate names case-insensitively, at the root and in folders', async () => {
    const folder = await createOk({ name: 'docs', type: 'folder' });
    await createOk({ name: 'a.txt', type: 'file' });
    await createOk({ name: 'a.txt', type: 'file', parentId: folder.id });

    assert.equal((await create({ name: 'A.TXT', type: 'file' })).status, 409);
    assert.equal((await create({ name: 'a.txt', type: 'file', parentId: folder.id })).status, 409);
  });

  it('lists folders before files, each sorted by name', async () => {
    await createOk({ name: 'b.txt', type: 'file' });
    await createOk({ name: 'z-folder', type: 'folder' });
    await createOk({ name: 'a.txt', type: 'file' });
    await createOk({ name: 'm-folder', type: 'folder' });

    const names = (await getJson('/api/nodes')).map((node) => node.name);

    assert.deepEqual(names, ['m-folder', 'z-folder', 'a.txt', 'b.txt']);
  });

  it('deletes a whole subtree when a folder is deleted', async () => {
    const top = await createOk({ name: 'top', type: 'folder' });
    const nested = await createOk({ name: 'nested', type: 'folder', parentId: top.id });
    await createOk({ name: 'deep.txt', type: 'file', parentId: nested.id });

    const response = await request(`/api/nodes/${top.id}`, { method: 'DELETE' });

    assert.equal(response.status, 204);
    assert.deepEqual(await getJson('/api/files/search?name=deep.txt'), []);
    assert.deepEqual(await getJson('/api/nodes'), []);
  });

  it('searches exact names in one folder or everywhere', async () => {
    const folder = await createOk({ name: 'docs', type: 'folder' });
    await createOk({ name: 'a.txt', type: 'file' });
    const inFolder = await createOk({ name: 'a.txt', type: 'file', parentId: folder.id });

    assert.equal((await getJson('/api/files/search?name=a.txt')).length, 2);
    assert.deepEqual(
      (await getJson(`/api/files/search?name=a.txt&parentId=${folder.id}`)).map((node) => node.id),
      [inFolder.id],
    );
  });

  it('suggests files by case-insensitive prefix, limited to 10, treating wildcards literally', async () => {
    await createOk({ name: 'report', type: 'folder' });
    await createOk({ name: '100%_done.txt', type: 'file' });
    await createOk({ name: '1000.txt', type: 'file' });
    for (let i = 0; i < 12; i++) {
      await createOk({ name: `Report-${String(i).padStart(2, '0')}.txt`, type: 'file' });
    }

    const reports = await getJson('/api/files/suggestions?prefix=rEPORT');
    const percent = await getJson(`/api/files/suggestions?prefix=${encodeURIComponent('100%')}`);
    const underscore = await getJson(`/api/files/suggestions?prefix=${encodeURIComponent('100%_')}`);

    assert.equal(reports.length, 10);
    assert.equal(reports[0].name, 'Report-00.txt');
    assert.deepEqual(percent.map((node) => node.name), ['100%_done.txt']);
    assert.equal(underscore.length, 1);
  });

  it('returns 404 for a missing parent and 400 for a file as parent', async () => {
    const file = await createOk({ name: 'a.txt', type: 'file' });

    const missing = await create({ name: 'x', type: 'file', parentId: crypto.randomUUID() });
    const notFolder = await create({ name: 'x', type: 'file', parentId: file.id });

    assert.equal(missing.status, 404);
    assert.equal(notFolder.status, 400);
  });
});
