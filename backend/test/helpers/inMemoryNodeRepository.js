import { randomUUID } from 'node:crypto';
import { ConflictError } from '../../src/errors.js';

export class InMemoryNodeRepository {
  nodes = new Map();

  async findById(id) {
    return this.nodes.get(id) ?? null;
  }

  async listChildren(parentId) {
    return [...this.nodes.values()].filter((node) => node.parentId === parentId);
  }

  async insert({ name, type, parentId }) {
    const siblings = await this.listChildren(parentId);
    if (siblings.some((node) => node.name.toLowerCase() === name.toLowerCase())) {
      throw new ConflictError(`"${name}" already exists in this folder`);
    }
    const node = { id: randomUUID(), parentId, name, type, createdAt: new Date() };
    this.nodes.set(node.id, node);
    return node;
  }

  async deleteById(id) {
    const children = await this.listChildren(id);
    await Promise.all(children.map((child) => this.deleteById(child.id)));
    return this.nodes.delete(id);
  }

  async findFilesByName(name, parentId) {
    return [...this.nodes.values()].filter(
      (node) => node.type === 'file' && node.name === name && (!parentId || node.parentId === parentId),
    );
  }

  async findFilesByNamePrefix(prefix, limit) {
    return [...this.nodes.values()]
      .filter((node) => node.type === 'file' && node.name.toLowerCase().startsWith(prefix.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit);
  }
}
