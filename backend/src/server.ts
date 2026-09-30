import { createApp } from './app.ts';
import { config } from './config.ts';
import { applySchema, createPool } from './db/pool.ts';
import { PostgresNodeRepository } from './repositories/postgresNodeRepository.ts';
import { NodeService } from './services/nodeService.ts';

const pool = createPool(config.databaseUrl);
await applySchema(pool);

const app = createApp(new NodeService(new PostgresNodeRepository(pool)));
const server = app.listen(config.port, () => {
  console.log(`API listening on port ${config.port}`);
});

process.on('SIGTERM', () => {
  server.close(() => pool.end());
});
