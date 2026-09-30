import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { createFilesRouter } from './routes/filesRouter.js';
import { createNodesRouter } from './routes/nodesRouter.js';

export function createApp(nodeService) {
  const app = express();
  app.use(express.json());
  app.use('/api/nodes', createNodesRouter(nodeService));
  app.use('/api/files', createFilesRouter(nodeService));
  app.use(errorHandler);
  return app;
}
