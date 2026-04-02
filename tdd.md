# SQL Practice Platform — TDD

## 1. Technical Goals
- execute untrusted SQL safely in isolation
- validate results accurately against problem expectations
- support three problem modes on shared infrastructure
- store submissions, progress, and content metadata cleanly
- make problem and testcase authoring straightforward

## 2. Architecture Overview

```
Frontend (React/Next.js)
    └── API Service (FastAPI / NestJS)
            ├── Problem Content Service
            ├── User Progress Service
            ├── Judge / Execution Service  ← highest risk component
            └── Admin Authoring Interface

Stores:
    PostgreSQL       — metadata, users, problems, submissions, progress
    Execution DB     — ephemeral per-submission sandbox (PostgreSQL-compatible)
    Redis            — queues, caching
    Object Storage   — dataset fixtures, exports
```

**Why separate judge service:** execution is highest-risk and most resource-sensitive. Isolation enables safer sandboxing, independent scaling, and future multi-engine support.

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js + TypeScript, Monaco editor, Tailwind |
| Backend | Python FastAPI or Node NestJS; REST initially |
| Auth | JWT / session-based |
| Metadata DB | PostgreSQL |
| Execution (MVP) | PostgreSQL-compatible sandbox, ephemeral per-submission |
| Execution (future) | DuckDB, Snowflake adapter, BigQuery adapter |
| Infrastructure | Docker containers, Kubernetes / serverless for scale |
| Queue / Cache | Redis |
| Fixtures | Object storage (S3-compatible) |

## 4. System Flow

```
User opens problem
    → frontend fetches problem metadata, schema, sample data, user progress

User clicks Run
    → backend sends query to execution sandbox (preview dataset only)
    → result preview returned

User clicks Submit
    → backend sends query to judge service
    → judge executes against ALL visible + hidden testcase datasets
    → result comparator validates correctness
    → submission record stored
    → feedback payload returned to frontend
    → progress metrics updated (async or inline)
```

## 5. Module Responsibilities

### Frontend
- problem browsing, editor UX, schema/sample data rendering
- submission + result views, hints + editorial display, progress dashboard
- pages: home, problem library, problem detail, assessment, profile, admin

### API Service
- auth and session handling
- problem retrieval and submission APIs
- hint/editorial access control
- progress aggregation
- admin CRUD for problems

### Judge / Execution Service
- create isolated execution context
- load problem dataset fixture
- execute SQL safely with resource limits
- collect output, timing, errors
- compare results against expected outputs or validator rules
- emit diagnostic failure categories

### Content Management Service
- problem statements, schemas, hints, editorials
- testcase bundles, tags, difficulty, dialect metadata

### Progress Service
- store attempts and compute mastery by topic
- compute streaks and learning insights
- support analytics for content quality

## 6. Data Model

### users
`id, email, name, auth_provider, created_at, subscription_tier`

### problems
`id, slug, title, description, mode, difficulty, dialect, status, estimated_time_minutes, author_id, created_at, updated_at`

### tags / problem_tags
`tags(id, name, category)` — `problem_tags(problem_id, tag_id)`

### schemas
`id, problem_id, table_name, column_definitions_json`

### datasets
`id, problem_id, name, type(sample|visible_testcase|hidden_testcase), fixture_location, validator_config_json`

### expected_results
`id, dataset_id, expected_output_json | validator_rule_ref`

### hints
`id, problem_id, hint_level, content`

### editorials
`id, problem_id, canonical_solution_sql, explanation_markdown, alternative_solutions_json, anti_patterns_json`

### submissions
`id, user_id, problem_id, submitted_sql, status, execution_time_ms, error_type, feedback_json, created_at`

### submission_test_results
`id, submission_id, dataset_id, passed, failure_category, execution_time_ms`

### user_problem_progress
`user_id, problem_id, first_attempt_at, solved_at, total_attempts, best_status, last_attempt_at`

### mastery_stats
`user_id, tag_id, attempts, solved_count, rolling_accuracy, updated_at`

## 7. Execution Design

### 7.1 Sandbox Strategy (MVP)
Each submission runs in an isolated containerized database session:
- read-only user permissions
- resource quotas (CPU, memory)
- query timeout
- no network access
- ephemeral dataset loading, destroyed after execution

### 7.2 SQL Allowlist
**Allowed:** SELECT, WITH/CTE, window functions, subqueries, JOINs, UNION  
**Blocked:** INSERT, UPDATE, DELETE, DROP, ALTER, CREATE (outside managed scope), external function calls

DE simulation mode: controlled transformation tasks using managed temp objects.

### 7.3 Dataset Loading Per Submission
1. Create isolated DB/session
2. Load schema DDL
3. Seed testcase data from fixture
4. Execute user query
5. Normalize result
6. Compare to expected
7. Destroy/reset environment

### 7.4 Result Normalization
Comparator supports:
- exact column set matching
- row-order-insensitive comparison (when order not required)
- numeric tolerance (configurable)
- null-aware comparison
- duplicate row sensitivity (configurable per problem)
- alias-insensitive or alias-sensitive comparison per problem rules

### 7.5 Failure Category Detection
Instead of just "wrong answer," classify failures such as:
- `duplicate_rows_after_join`
- `missing_null_handling`
- `incorrect_grouping_grain`
- `ordering_mismatch`
- `tie_handling_issue`
- `date_boundary_issue`
- `filter_applied_too_early_or_late`
- `missing_deduplication`

Inferred from testcase deltas and heuristic checks.

## 8. Problem Design Framework

Each problem must include: statement, business/technical context, schema definitions, sample input tables, expected output format, difficulty + concept tags, learning objectives, hidden testcase strategy, canonical solution, alternative approaches, common mistakes.

### Hidden Testcase Design Principles

**Ranking problem:** ties, nulls, duplicate source rows, empty partitions, single-row partitions

**DE deduplication problem:** out-of-order events, same key with newer timestamp, identical payload duplicates, missing update timestamps

## 9. API Design

### User APIs
```
GET    /problems
GET    /problems/{slug}
POST   /problems/{id}/run
POST   /problems/{id}/submit
GET    /problems/{id}/hints
GET    /problems/{id}/editorial
GET    /users/me/progress
GET    /users/me/submissions
```

### Admin APIs
```
POST   /admin/problems
PUT    /admin/problems/{id}
POST   /admin/problems/{id}/datasets
POST   /admin/problems/{id}/editorial
POST   /admin/problems/{id}/publish
```

### Example Submit Response
```json
{
  "submission_id": "sub_123",
  "status": "failed",
  "passed_visible": true,
  "passed_hidden": false,
  "failure_categories": ["duplicate_rows_after_join", "missing_null_handling"],
  "execution_time_ms": 182,
  "hint_unlock_available": true,
  "feedback": {
    "summary": "Your query works for the sample case but fails when multiple matching rows exist in the joined table.",
    "next_step": "Check the grain of each table before joining and consider whether deduplication or pre-aggregation is needed."
  }
}
```

## 10. Performance, Security, Observability

### Performance
- cache problem metadata and editorials
- keep fixtures small enough for interactive speed, large enough to expose realistic issues
- separate preview runs from full submit runs
- queue submissions on concurrency spikes
- warm pools of sandbox containers if needed

### Security
- no raw access to production databases
- per-submission isolation
- strict query timeout and memory limits
- SQL statement parsing / allowlist before execution
- rate limiting on run/submit endpoints
- audit logs for admin content changes

### Observability — Track
- query execution times, judge vs user failure rates
- sandbox startup latency
- most common failure categories
- top confusing problems, hidden testcase over-failure rate

**Tooling:** structured logs, metrics dashboards, alerting on judge error spikes, request→execution traces

## 11. Testing Strategy

| Type | Coverage |
|---|---|
| Unit | result comparator, validator rules, failure categorization, progress computation |
| Integration | submission flow E2E, sandbox lifecycle, problem retrieval and hint unlock |
| Content | canonical solution passes all testcases; every hidden testcase fails at least one flawed query |
| Security | blocked DDL/DML, timeout behavior, resource exhaustion, SQL injection against metadata |

## 12. Deployment Strategy

### MVP
- Frontend: Vercel or equivalent
- Backend + Judge: container platform
- PostgreSQL: managed service
- Redis: optional for queueing
- Object storage: fixtures

### Scale-Up Path
1. Split judge workers from API nodes
2. Introduce job queue for submissions
3. Autoscaling worker pools
4. Engine adapters for dialect expansion

## 13. MVP Delivery Phases

**Phase 1 — Foundations**
Auth, problem catalog, SQL editor, single-engine execution sandbox, visible/hidden testcase framework

**Phase 2 — Learning Layer**
Hints, editorial explanations, progress tracking, tags and mastery dashboard

**Phase 3 — Real-World Depth**
Data engineering mode datasets, timed assessments, richer failure diagnostics

## 14. Post-MVP Roadmap
- multi-dialect SQL execution
- personalized study plans
- AI tutor for query review
- resume/interview readiness assessment
- company-specific SQL packs
- full DE project simulations with multi-step tasks
