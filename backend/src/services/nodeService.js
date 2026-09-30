import { NotFoundError, ValidationError } from '../errors.js';

const SUGGESTION_LIMIT = 10;

export class NodeService {
  constructor(nodeRepository) {
    this.nodeRepository = nodeRepository;
  }

  async listChildren(parentId = null) {
    if (parentId) {
      await this.#requireFolder(parentId);
    }
    return this.nodeRepository.listChildren(parentId);
  }

  async create({ name, type, parentId = null }) {
    if (parentId) {
      await this.#requireFolder(parentId);
    }
    return this.nodeRepository.insert({ name, type, parentId });
  }

  async delete(id) {
    const deleted = await this.nodeRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError(`Node ${id} not found`);
    }
  }

  async findFilesByName(name, parentId) {
    if (parentId) {
      await this.#requireFolder(parentId);
    }
    return this.nodeRepository.findFilesByName(name, parentId);
  }

  suggestFiles(prefix) {
    return this.nodeRepository.findFilesByNamePrefix(prefix, SUGGESTION_LIMIT);
  }

  async #requireFolder(id) {
    const node = await this.nodeRepository.findById(id);
    if (!node) {
      throw new NotFoundError(`Folder ${id} not found`);
    }
    if (node.type !== 'folder') {
      throw new ValidationError(`${id} is a file, not a folder`);
    }
  }
}
