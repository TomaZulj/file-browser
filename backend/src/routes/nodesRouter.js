import { Router } from 'express';
import { createBody, idParams, listQuery } from './schemas.js';

export function createNodesRouter(nodeService) {
  const router = Router();

  router.get('/', async (req, res) => {
    const { parentId } = listQuery.parse(req.query);
    res.json(await nodeService.listChildren(parentId));
  });

  router.post('/', async (req, res) => {
    const node = await nodeService.create(createBody.parse(req.body));
    res.status(201).location(`/api/nodes/${node.id}`).json(node);
  });

  router.delete('/:id', async (req, res) => {
    const { id } = idParams.parse(req.params);
    await nodeService.delete(id);
    res.status(204).end();
  });

  return router;
}
