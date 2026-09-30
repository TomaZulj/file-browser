import { NotFoundError, ValidationError } from '../errors.ts';
import type { CreateNodeInput, FileSystemNode, NodeRepository } from '../types.ts';

const SUGGESTION_LIMIT = 10;

export class NodeService {
  private readonly nodeRepository: NodeRepository;

  constructor(nodeRepository: NodeRepository) {
    this.nodeRepository = nodeRepository;
  }

  async listChildren(parentId: string | null = null): Promise<FileSystemNode[]> {
    if (parentId) {
      await this.requireFolder(parentId);
    }
    return this.nodeRepository.listChildren(parentId);
  }

  async create({ name, type, parentId = null }: CreateNodeInput): Promise<FileSystemNode> {
    if (parentId) {
      await this.requireFolder(parentId);
    }
    return this.nodeRepository.insert({ name, type, parentId });
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.nodeRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError(`Node ${id} not found`);
    }
  }

  async findFilesByName(name: string, parentId?: string): Promise<FileSystemNode[]> {
    if (parentId) {
      await this.requireFolder(parentId);
    }
    return this.nodeRepository.findFilesByName(name, parentId);
  }

  suggestFiles(prefix: string): Promise<FileSystemNode[]> {
    return this.nodeRepository.findFilesByNamePrefix(prefix, SUGGESTION_LIMIT);
  }

  private async requireFolder(id: string): Promise<void> {
    const node = await this.nodeRepository.findById(id);
    if (!node) {
      throw new NotFoundError(`Folder ${id} not found`);
    }
    if (node.type !== 'folder') {
      throw new ValidationError(`${id} is a file, not a folder`);
    }
  }
}
