# Codex Checkpoint — 2026-04-02

## Summary

- Read and audited `session-notes.md` critically instead of following it as ground truth.
- Verified the frontend stack and fixed concrete repo issues blocking install/build.
- Added a `/profile` page and tightened auth-loading behavior in the frontend.
- Added the initial Alembic schema migration that was missing despite the notes claiming migrations were ready.
- Pivoted backend defaults away from Postgres-only assumptions so the project can move toward a viable MVP without Docker.

## Frontend changes

- Removed invalid/unused package entries that blocked `npm install`.
- Replaced unsupported `next.config.ts` with `next.config.mjs`.
- Added `frontend/.eslintrc.json` so lint can run non-interactively.
- Split `/problems` into a server wrapper plus client component so Next 14 can build successfully.
- Added `/profile` with progress and recent submission views.
- Improved navbar and problem-page auth loading behavior.

## Backend changes

- Added `backend/alembic/versions/20260402_1200_initial_schema.py`.
- Changed default database config from Postgres to local SQLite.
- Replaced Postgres-specific SQLAlchemy types with portable types in models.
- Added `aiosqlite` dependency for local async SQLite support.

## Validation completed

- `npm install`
- `npm run build`
- `npm run lint`
- `npm run dev` on `127.0.0.1:3000`

## Remaining constraints

- Backend runtime is still blocked on this machine because `python3 -m venv` fails without `python3.12-venv` / `ensurepip`.
- The current frontend is still API-oriented. It does not yet implement DuckDB WASM, IndexedDB, or Vitest.

## Next branch goal

Create a local-first frontend architecture using:

- DuckDB WASM for in-browser SQL execution
- IndexedDB for persistence
- Local seeded problems/datasets
- Monaco for editing
- Vitest for frontend validation
