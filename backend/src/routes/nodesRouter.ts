import { Router } from 'express';
import type { NodeService } from '../services/nodeService.ts';
import { createBody, idParams, listQuery } from './schemas.ts';

export function createNodesRouter(nodeService: NodeService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const { parentId } = listQuery.parse(req.query);
    res.json(await nodeService.listChildren(parentId));
  });

  router.post('/', async (req, res) => {
    const node = await nodeService.create(createBody.parse(req.body));
    res.status(201).location(`/api/nodes/${node.id}`).json(node);
  });

  router.get('/:id/ancestors', async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await nodeService.listAncestors(id));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = idParams.parse(req.params);
    await nodeService.delete(id);
    res.status(204).end();
  });

  return router;
}
