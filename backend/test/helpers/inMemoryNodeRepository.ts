import { randomUUID } from 'node:crypto';
import { ConflictError } from '../../src/errors.ts';
import type { FileSystemNode, NewNode, NodeRepository } from '../../src/types.ts';

export class InMemoryNodeRepository implements NodeRepository {
  private readonly nodes = new Map<string, FileSystemNode>();

  async findById(id: string) {
    return this.nodes.get(id) ?? null;
  }

  async listChildren(parentId: string | null) {
    return [...this.nodes.values()].filter((node) => node.parentId === parentId);
  }

  async findAncestors(id: string) {
    const ancestors: FileSystemNode[] = [];
    let parentId = this.nodes.get(id)?.parentId ?? null;
    while (parentId) {
      const parent = this.nodes.get(parentId)!;
      ancestors.unshift(parent);
      parentId = parent.parentId;
    }
    return ancestors;
  }

  async insert({ name, type, parentId }: NewNode) {
    const siblings = await this.listChildren(parentId);
    if (siblings.some((node) => node.name.toLowerCase() === name.toLowerCase())) {
      throw new ConflictError(`"${name}" already exists in this folder`);
    }
    const node: FileSystemNode = { id: randomUUID(), parentId, name, type, createdAt: new Date() };
    this.nodes.set(node.id, node);
    return node;
  }

  async deleteById(id: string): Promise<boolean> {
    const children = await this.listChildren(id);
    await Promise.all(children.map((child) => this.deleteById(child.id)));
    return this.nodes.delete(id);
  }

  async findFilesByName(name: string, parentId?: string) {
    return [...this.nodes.values()].filter(
      (node) => node.type === 'file' && node.name === name && (!parentId || node.parentId === parentId),
    );
  }

  async findFilesByNamePrefix(prefix: string, limit: number) {
    return [...this.nodes.values()]
      .filter((node) => node.type === 'file' && node.name.toLowerCase().startsWith(prefix.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);
  }
}
