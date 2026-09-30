# File browser

A browser-based file system: create folders and files, navigate the tree, search files by exact name or by name prefix, and delete.

- **Backend**: TypeScript on Node.js 24 LTS (runs `.ts` directly, no build step), Express 5 (async/await handlers), PostgreSQL 18 via `pg`
- **Frontend**: TypeScript, React 19 (Vite 8)
- **Deployment**: Docker Compose

## Run with Docker

Requires Docker with Compose. Stop with `docker compose down` (add `-v` to also delete the data).

```sh
docker compose up --build
```

Open http://localhost:8080. The API is also exposed on http://localhost:3000.

## Run in debug mode (no Docker for the app)

Requires Node.js 24 and a PostgreSQL instance. The quickest way to get one:

```sh
docker compose up -d db
```

Backend (http://localhost:3000, restarts on file changes):

```sh
cd backend
npm install
npm run dev
```

Frontend (http://localhost:5173, proxies `/api` to the backend):

```sh
cd frontend
npm install
npm run dev
```

Backend settings are environment variables, defaults match the compose `db` service: `PORT` (3000) and `DATABASE_URL` (`postgres://files:files@localhost:5432/files`).

## Tests

```sh
cd backend
npm install
npm test
```

Type-check with `npm run typecheck` (in `backend` or `frontend`). Tests need no database. They run the service and HTTP layers against an in-memory repository.

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/nodes?parentId=` | List children of a folder (root when `parentId` is omitted) |
| `POST` | `/api/nodes` | Create a folder or file. Body: `{ "name", "type": "file" \| "folder", "parentId"? }`. Returns `201` |
| `DELETE` | `/api/nodes/:id` | Delete a file or folder (folders delete their whole subtree). Returns `204` |
| `GET` | `/api/files/search?name=&parentId=` | Files with exactly this name. Searches everywhere when `parentId` is omitted |
| `GET` | `/api/files/suggestions?prefix=` | Top 10 files whose name starts with `prefix` (case-insensitive), sorted by name |

Errors return `{ "error": "message" }` with `400` (invalid input), `404` (unknown id) or `409` (name already used in that folder).

## Design

```
backend/src
  routes/        HTTP only: parse and validate input, map to status codes
  services/      Business rules (parent must be a folder, unique names)
  repositories/  All SQL
  db/            Connection pool and schema
frontend/src
  api/           Fetch wrapper and API types
  components/    UI
```

**Data model**: one `nodes` table holding both files and folders (`id`, `parent_id`, `name`, `type`, `created_at`). `parent_id` is a self-referencing foreign key with `ON DELETE CASCADE`, so deleting a folder removes its subtree in a single statement. A unique index on `(parent_id, lower(name))` (with `NULLS NOT DISTINCT`, so the root counts as a folder too) prevents duplicate names within a folder, and is enforced by the database so concurrent requests cannot race past it. A partial index on `lower(name)` for files backs the prefix search.

## Trade-offs and limitations

- Names are unique per folder case-insensitively (`Report.txt` and `report.txt` conflict). Exact-name search is case-sensitive, prefix search is not.
- Search results show file names only, not their full path, and there is no move, rename or pagination of folder contents.
- The schema is created at backend startup from a single SQL file. A real deployment would use a migration tool.
- Backend tests use an in-memory repository, so the SQL itself is only verified by running the app, not by automated tests.
- API types are declared separately in `backend` and `frontend` (no shared package) to keep the repo simple.
- No authentication, as per the brief.
