# SQL Practice Platform

## Getting started

### Prerequisites
- Python 3.12+
- Node.js 18+
- Docker (optional, for local Postgres later)

### Backend

```bash
# Install deps
cd backend
python3 -m venv .venv
source .venv/Scripts/activate    # Windows
pip install uv
uv pip install -e ".[dev]"

# Copy env
cp .env.example .env

# Run migrations against the default local SQLite DB
alembic upgrade head

# Seed initial problems
python scripts/seed_problems.py

# Start API server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

Postgres is optional for the MVP. The default backend config now uses local SQLite so you can validate the product loop without Docker.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

### Run backend tests

```bash
cd backend
pytest -v
```

## Project structure

```
backend/
  app/
    auth/         — JWT auth (register, login)
    problems/     — problem catalog APIs
    execution/    — DuckDB sandbox, SQL allowlist, comparator, classifier
    submissions/  — submission history, user progress
    models/       — SQLAlchemy ORM models
  alembic/        — database migrations
  scripts/        — seed scripts
  tests/

frontend/
  src/
    app/          — Next.js App Router pages
    components/   — editor, problem UI, layout
    hooks/        — React Query hooks
    lib/          — API client, auth context, utils
    types/        — TypeScript types matching backend schemas
```
