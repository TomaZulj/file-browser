import { Router } from 'express';
import type { NodeService } from '../services/nodeService.ts';
import { searchQuery, suggestionsQuery } from './schemas.ts';

export function createFilesRouter(nodeService: NodeService): Router {
  const router = Router();

  router.get('/search', async (req, res) => {
    const { name, parentId } = searchQuery.parse(req.query);
    res.json(await nodeService.findFilesByName(name, parentId));
  });

  router.get('/suggestions', async (req, res) => {
    const { prefix } = suggestionsQuery.parse(req.query);
    res.json(await nodeService.suggestFiles(prefix));
  });

  return router;
}
