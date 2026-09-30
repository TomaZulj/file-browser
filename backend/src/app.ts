import express from 'express';
import { errorHandler } from './middleware/errorHandler.ts';
import { createFilesRouter } from './routes/filesRouter.ts';
import { createNodesRouter } from './routes/nodesRouter.ts';
import type { NodeService } from './services/nodeService.ts';

export function createApp(nodeService: NodeService): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/nodes', createNodesRouter(nodeService));
  app.use('/api/files', createFilesRouter(nodeService));
  app.use(errorHandler);
  return app;
}
