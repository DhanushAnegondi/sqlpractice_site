# SQL Practice Platform — Session Notes

## What was done

### Documents
- Created `prd.md` — condensed PRD with appendices for learning design, positioning, and MVP problem themes
- Created `tdd.md` — condensed TDD with architecture, data model, execution design, APIs, and deployment plan
- Deleted original combined `sql_practice_platform_prd_tdd.md`
- Pushed both files to GitHub: `DhanushAnegondi/sqlpractice_site` (main branch)

### Phase 1 — Fully built

#### Backend (`backend/`)
- **Foundation:** `pyproject.toml`, `app/config.py`, `app/database.py`, `app/main.py`, Alembic setup
- **Models:** User, Problem, Tag, ProblemTag, SchemaTable, Dataset, ExpectedResult, Hint, Editorial, Submission, SubmissionTestResult, UserProblemProgress, MasteryStats
- **Auth:** register, login (JWT), `get_current_user` dependency — `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- **Problems API:** `GET /problems` (filtered by difficulty/mode/tag/search), `GET /problems/{slug}`
- **Execution sandbox:**
  - `allowlist.py` — sqlglot AST parser blocks all non-SELECT SQL
  - `sandbox.py` — DuckDB in-memory, isolated per call, 10s timeout, 256MB limit
  - `comparator.py` — result normalization (order, nulls, numerics, duplicates)
  - `classifier.py` — failure category detection (duplicate join, missing null, wrong grain, ordering, etc.)
  - `router.py` — `POST /problems/{slug}/run` and `POST /problems/{slug}/submit` with full judge flow
- **Submissions:** `GET /users/me/submissions`, `GET /users/me/progress`
- **Seed script:** `scripts/seed_problems.py` — seeds 3 problems with hidden testcases:
  1. Duplicate Emails (easy, interview)
  2. Top Customer by Spend (medium, interview)
  3. Deduplicate CDC Records (medium, data_engineering)
- **Tests:** `tests/test_sandbox.py`, `tests/test_comparator.py`

#### Frontend (`frontend/`)
- **Stack:** Next.js 14 + TypeScript + Tailwind + Monaco Editor + React Query
- **API client:** `src/lib/api.ts` — typed fetch wrapper for all backend endpoints
- **Auth:** `src/lib/auth.ts` — `AuthContext`, `useAuth` hook, JWT in localStorage
- **Pages:**
  - `/` — landing page with mode cards
  - `/login`, `/register` — auth forms
  - `/problems` — filterable problem list (difficulty, mode, search)
  - `/problems/[slug]` — two-panel layout: description/schema left, Monaco editor + results right
- **Components:**
  - `SqlEditor.tsx` — Monaco editor (lazy-loaded, SSR-safe)
  - `ResultsPane.tsx` — run output table + submit pass/fail + failure categories + feedback
  - `SchemaViewer.tsx` — collapsible schema and sample data per table
  - `Navbar.tsx`, `Providers.tsx`

---

## How to run

```bash
# Postgres
docker compose up -d

# Backend
cd backend
python -m venv .venv && source .venv/Scripts/activate
pip install uv && uv pip install -e ".[dev]"
cp .env.example .env
alembic upgrade head
python scripts/seed_problems.py
uvicorn app.main:app --reload --port 8000

# Frontend (Node.js required)
cd frontend
npm install
npm run dev
```

---

## Next steps (Phase 2)

- [ ] **Hints API** — `GET /problems/{slug}/hints` (progressive unlock)
- [ ] **Editorial API** — `GET /problems/{slug}/editorial` (unlock after solve)
- [ ] **Hints UI** — layered hint reveal on problem detail page
- [ ] **Editorial UI** — canonical solution + explanation after submission
- [ ] **Progress dashboard** — `/profile` page showing solved problems, mastery by topic, streaks
- [ ] **Mastery stats computation** — update `mastery_stats` table after each submission
- [ ] **Install Node.js** — frontend can't run yet without it
- [ ] **Admin seed more problems** — add remaining 12 of the first 15 MVP themes from `prd.md` Appendix C
- [ ] **Backend tests for auth and API** — `tests/test_auth.py`, `tests/test_problems.py`

## Phase 3 (after Phase 2)
- Timed assessment mode
- Richer failure diagnostics
- More DE mode problems (SCD Type 2, incremental load, source-target reconciliation)
- Multi-dialect execution (DuckDB as offline Snowflake/BigQuery approximation)
