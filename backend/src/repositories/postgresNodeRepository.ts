import type pg from 'pg';
import { ConflictError, NotFoundError } from '../errors.ts';
import type { FileSystemNode, NewNode, NodeRepository, NodeType } from '../types.ts';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

const COLUMNS = 'id, parent_id, name, type, created_at';

interface NodeRow {
  id: string;
  parent_id: string | null;
  name: string;
  type: NodeType;
  created_at: Date;
}

function toNode(row: NodeRow): FileSystemNode {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    type: row.type,
    createdAt: row.created_at,
  };
}

function escapeLikePattern(text: string): string {
  return text.replace(/[\\%_]/g, '\\$&');
}

function hasDatabaseCode(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}

export class PostgresNodeRepository implements NodeRepository {
  private readonly pool: pg.Pool;

  constructor(pool: pg.Pool) {
    this.pool = pool;
  }

  async findById(id: string): Promise<FileSystemNode | null> {
    const { rows } = await this.pool.query<NodeRow>(`SELECT ${COLUMNS} FROM nodes WHERE id = $1`, [id]);
    return rows[0] ? toNode(rows[0]) : null;
  }

  async listChildren(parentId: string | null): Promise<FileSystemNode[]> {
    const { rows } = await this.pool.query<NodeRow>(
      `SELECT ${COLUMNS} FROM nodes
       WHERE parent_id IS NOT DISTINCT FROM $1
       ORDER BY type, lower(name)`,
      [parentId],
    );
    return rows.map(toNode);
  }

  async insert({ name, type, parentId }: NewNode): Promise<FileSystemNode> {
    try {
      const { rows } = await this.pool.query<NodeRow>(
        `INSERT INTO nodes (name, type, parent_id) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
        [name, type, parentId],
      );
      return toNode(rows[0]);
    } catch (error) {
      if (hasDatabaseCode(error, UNIQUE_VIOLATION)) {
        throw new ConflictError(`"${name}" already exists in this folder`);
      }
      if (hasDatabaseCode(error, FOREIGN_KEY_VIOLATION)) {
        throw new NotFoundError('Parent folder not found');
      }
      throw error;
    }
  }

  async deleteById(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM nodes WHERE id = $1', [id]);
    return rowCount !== null && rowCount > 0;
  }

  async findFilesByName(name: string, parentId?: string): Promise<FileSystemNode[]> {
    const { rows } = await this.pool.query<NodeRow>(
      `SELECT ${COLUMNS} FROM nodes
       WHERE type = 'file' AND name = $1 AND ($2::uuid IS NULL OR parent_id = $2)
       ORDER BY created_at`,
      [name, parentId ?? null],
    );
    return rows.map(toNode);
  }

  async findFilesByNamePrefix(prefix: string, limit: number): Promise<FileSystemNode[]> {
    const { rows } = await this.pool.query<NodeRow>(
      `SELECT ${COLUMNS} FROM nodes
       WHERE type = 'file' AND lower(name) LIKE $1 ESCAPE '\\'
       ORDER BY lower(name)
       LIMIT $2`,
      [`${escapeLikePattern(prefix.toLowerCase())}%`, limit],
    );
    return rows.map(toNode);
  }
}
