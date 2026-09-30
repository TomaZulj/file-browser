import { createApp } from './app.js';
import { config } from './config.js';
import { applySchema, createPool } from './db/pool.js';
import { PostgresNodeRepository } from './repositories/postgresNodeRepository.js';
import { NodeService } from './services/nodeService.js';

const pool = createPool(config.databaseUrl);
await applySchema(pool);

const app = createApp(new NodeService(new PostgresNodeRepository(pool)));
const server = app.listen(config.port, () => {
  console.log(`API listening on port ${config.port}`);
});

process.on('SIGTERM', () => {
  server.close(() => pool.end());
});
