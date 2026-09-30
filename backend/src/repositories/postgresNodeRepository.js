import { ConflictError, NotFoundError } from '../errors.js';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

const COLUMNS = 'id, parent_id, name, type, created_at';

function toNode(row) {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    type: row.type,
    createdAt: row.created_at,
  };
}

function escapeLikePattern(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}

export class PostgresNodeRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query(`SELECT ${COLUMNS} FROM nodes WHERE id = $1`, [id]);
    return rows[0] ? toNode(rows[0]) : null;
  }

  async listChildren(parentId) {
    const { rows } = await this.pool.query(
      `SELECT ${COLUMNS} FROM nodes
       WHERE parent_id IS NOT DISTINCT FROM $1
       ORDER BY type, lower(name)`,
      [parentId],
    );
    return rows.map(toNode);
  }

  async insert({ name, type, parentId }) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO nodes (name, type, parent_id) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
        [name, type, parentId],
      );
      return toNode(rows[0]);
    } catch (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new ConflictError(`"${name}" already exists in this folder`);
      }
      if (error.code === FOREIGN_KEY_VIOLATION) {
        throw new NotFoundError('Parent folder not found');
      }
      throw error;
    }
  }

  async deleteById(id) {
    const { rowCount } = await this.pool.query('DELETE FROM nodes WHERE id = $1', [id]);
    return rowCount > 0;
  }

  async findFilesByName(name, parentId) {
    const { rows } = await this.pool.query(
      `SELECT ${COLUMNS} FROM nodes
       WHERE type = 'file' AND name = $1 AND ($2::uuid IS NULL OR parent_id = $2)
       ORDER BY created_at`,
      [name, parentId ?? null],
    );
    return rows.map(toNode);
  }

  async findFilesByNamePrefix(prefix, limit) {
    const { rows } = await this.pool.query(
      `SELECT ${COLUMNS} FROM nodes
       WHERE type = 'file' AND lower(name) LIKE $1 ESCAPE '\\'
       ORDER BY lower(name)
       LIMIT $2`,
      [`${escapeLikePattern(prefix.toLowerCase())}%`, limit],
    );
    return rows.map(toNode);
  }
}
