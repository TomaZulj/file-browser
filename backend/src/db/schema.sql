CREATE TABLE IF NOT EXISTS nodes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  UUID REFERENCES nodes (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('file', 'folder')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique names per folder, including the root where parent_id is NULL.
CREATE UNIQUE INDEX IF NOT EXISTS nodes_unique_name_per_parent
  ON nodes (COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'), lower(name));

-- Serves the "starts with" file search.
CREATE INDEX IF NOT EXISTS nodes_file_name_prefix
  ON nodes (lower(name) text_pattern_ops)
  WHERE type = 'file';
