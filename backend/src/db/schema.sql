CREATE TABLE IF NOT EXISTS nodes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  UUID REFERENCES nodes (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('file', 'folder')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique names per folder. NULLS NOT DISTINCT makes the root (parent_id NULL) one folder too.
CREATE UNIQUE INDEX IF NOT EXISTS nodes_unique_name_per_parent
  ON nodes (parent_id, lower(name)) NULLS NOT DISTINCT;

-- Serves the "starts with" file search.
CREATE INDEX IF NOT EXISTS nodes_file_name_prefix
  ON nodes (lower(name) text_pattern_ops)
  WHERE type = 'file';
