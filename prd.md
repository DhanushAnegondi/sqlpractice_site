# SQL Practice Platform — PRD

## 1. Product Summary
A web-based SQL learning environment where users solve realistic SQL problems using an in-browser editor against curated datasets. Combines coding-challenge rigor with structured learning support.

Emphasis on:
- passing hidden and visible testcases
- business logic and edge case understanding
- warehouse-style schemas and messy production data
- detailed feedback on correctness, reasoning, and query efficiency

## 2. Vision
Build the best SQL practice platform for learners preparing for data engineering, analytics engineering, data analyst, BI, and SQL interview roles — blending LeetCode rigor, StrataScratch business context, and warehouse-environment realism.

## 3. Problem Statement
Most SQL platforms fail by:
- over-focusing on toy examples
- not simulating real schemas or messy data
- not testing enough edge cases
- only judging right/wrong without teaching improvement
- ignoring production thinking (nulls, duplicates, late data, CDC, performance)

## 4. Target Users
**Primary:** aspiring data engineers, analytics engineers, data analysts, software engineers transitioning to data, SQL interview prep students  
**Secondary:** bootcamp students, interview coaches, hiring teams

## 5. User Needs
- structured practice from beginner to advanced
- interview-style SQL with deterministic test validation
- real business and data warehouse scenarios
- understand reasoning and edge cases, not just answers
- reusable SQL pattern learning
- timed pressure practice
- multiple valid solution comparison
- Snowflake/Postgres/BigQuery-flavored environments

## 6. Goals

**Business:** differentiated product, repeat usage via streaks, future monetization (premium tracks, assessments, mock interviews)

**User:** consistent SQL interview performance, real-world SQL mastery, debugging and edge case handling

**Learning:** SQL pattern recognition, joins/aggregations/windows/CTEs/deduplication/temporal logic, warehouse-oriented SQL practices

## 7. Success Metrics

| Category | Metrics |
|---|---|
| User success | completion rate, first-attempt pass rate, improvement over time, patterns mastered, 7/30/90-day retention |
| Product health | DAU, weekly return rate, problems/week, hint usage rate, explanation completion |
| Learning quality | hidden testcase failure categories, confidence ratings, timed assessment improvement |

## 8. Product Principles
- **Learning first:** feedback should teach, not just judge
- **Realism matters:** datasets must resemble real work
- **Correctness matters:** robust validation required
- **Multiple paths:** accept logically equivalent solutions
- **Progressive difficulty:** clean toy tables → messy enterprise schemas
- **Explain the why:** every problem teaches a reusable concept

## 9. Core Features

### 9.1 Problem Library
Organized by: difficulty (easy/medium/hard), mode (interview/analytics/data engineering), topic (joins, group by, windows, CTEs, deduplication, SCD, CDC, funnels, retention, data quality), platform flavor (Postgres, Snowflake, BigQuery, ANSI)

### 9.2 Three Practice Modes

**Interview mode** (LeetCode-style)
- strict statement, schema, sample data, visible + hidden testcases, deterministic pass/fail, optional canonical solutions

**Analytics mode** (StrataScratch-style)
- business prompt, larger realistic tables, interpretation + correctness focus, expected output with assumptions

**Data Engineering mode** (production simulation)
- deduplicate CDC streams, incremental tables, event sessionization, pipeline anomaly detection, source-target reconciliation, SCD Type 2, late-arriving facts, data quality checks, warehouse reporting layers

### 9.3 SQL Editor
- browser-based editor with syntax highlighting, auto-formatting
- run / submit workflow, result preview, schema browser, execution feedback
- optional query plan view

### 9.4 Testcase Engine
- visible (learning) + hidden (rigor) testcases
- exact match and logical equivalence checks
- edge case datasets: nulls, duplicates, empty tables, ties, late records, date boundaries
- partial diagnostic feedback on failure categories

### 9.5 Feedback Engine
Per submission returns: pass/fail, failure category, concept tags, layered hints, canonical solution, alternative patterns, performance notes, edge case rationale

### 9.6 Guided Learning
- progressive hints, pattern notes (e.g. "this is a gaps-and-islands problem")
- post-solution breakdown, anti-pattern warnings, step-by-step mode
- compare user query vs canonical query

### 9.7 Progress Tracking
- solved problems, topic mastery, accuracy by topic/difficulty
- streaks, study heatmap, saved notes, review-later list
- mock interview readiness score

### 9.8 Assessment Mode
- timed rounds, randomized problems, hidden-only evaluation
- scorecard by topic; recruiter/team mode in later versions

### 9.9 Discussion Layer
- official editorial, user notes/comments, common mistakes, edge case walkthroughs

## 10. Problem Categories

| Level | Topics |
|---|---|
| Foundational | select/filter/order, joins, aggregations, case when, subqueries |
| Intermediate | window functions, ranking, deduplication, cohort analysis, date arithmetic, funnels, conditional aggregation |
| Advanced Interview | gaps and islands, running totals, nth highest, recursive CTEs, median/percentile, sessionization |
| Analytics | attribution, retention, WAU, churn, conversion, revenue, experiment metrics |
| Data Engineering | CDC merge, SCD Type 2, source-target reconciliation, incremental load, snapshot tables, late events, partition-aware reporting, duplicate suppression, pipeline quality |

## 11. User Stories

**Learner:**
- solve LeetCode-style SQL with hidden testcase validation
- practice realistic business datasets
- get layered hints without seeing the full answer immediately
- understand why wrong answers fail
- track weak patterns systematically
- practice timed assessments

**Admin/Content:**
- create problems, datasets, hidden testcases, and editorial explanations
- tag by topic, difficulty, and SQL dialect
- review submission analytics to improve weak questions

## 12. Scope

**MVP:** auth, problem list + filters, SQL editor, schema/dataset viewer, run/submit workflow, visible + hidden testcase validation, three modes with curated content, hints + editorial, progress dashboard, basic comments

**Post-MVP:** multi-dialect execution, AI-generated feedback, personalized learning paths, mock interviews, team assessments, leaderboards, DE project simulations, premium tracks

## 13. Functional Requirements

| Area | Requirement |
|---|---|
| Browsing | filter by difficulty/topic/mode/dialect; search by title or concept |
| Problem solving | open problem with statement/schema/sample data; write and run SQL; submit for validation |
| Validation | evaluate against hidden + visible testcases; support order-insensitive comparison; return pass/fail + diagnostics |
| Feedback | progressive hints; editorial unlock on solve or submission; alternative approaches |
| Progress | store attempts, solve status, time, error categories; update mastery dashboard |
| Content authoring | admin CRUD for datasets, problems, expected outputs, hidden testcases; define equivalence and order rules |

## 14. Non-Functional Requirements
- low query execution latency for moderate datasets
- safe multi-tenant sandboxing
- deterministic evaluation
- high availability for core practice workflow
- scalable concurrent submission handling
- strong observability for query failures and judge errors
- secure session isolation

## 15. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Destructive/heavy user SQL | sandbox with strict permissions, time/resource limits |
| Equivalent-answer validation complexity | robust logical equivalence framework |
| Hidden testcase quality issues | content-author review pipeline |
| Multi-dialect engineering cost | single dialect first, adapter pattern later |
| Dataset size/speed | controlled snapshots, size limits on fixtures |

## 16. Open Questions
- MVP: one dialect first or multiple?
- Should query performance affect scoring initially?
- When to reveal full editorial?
- How much AI assistance during practice?
- DE mode: SQL-only or include pipeline design notes later?

---

## Appendix A: Learning Design

### Teaching in Layers
1. **Solve** — user writes and submits
2. **Diagnose** — explain precisely why the query failed
3. **Generalize** — identify the reusable SQL pattern
4. **Extend** — show how the pattern appears in interviews and production

Example cross-mode linking:
- Interview: find latest order per customer
- Analytics: find latest subscription status per user
- DE: deduplicate CDC stream to latest record per business key

### Best-in-Class Learning Features (Post-MVP)
- "Pattern map" grouping problems by reusable SQL idea
- "Why your query failed" visual diff tool
- "Explain this solution line by line" mode
- "Show me the bad version" anti-pattern mode
- "Same concept, harder dataset" follow-up suggestions
- "Warehouse version of this problem" recommendation

---

## Appendix B: MVP Positioning

**Build order priority:**
1. One SQL dialect (Postgres-compatible)
2. Rock-solid hidden testcase engine
3. Detailed educational feedback
4. Strong problem curation for three modes
5. Progress and mastery system

**Differentiator:** A serious SQL judge with real-world data engineering realism and deep teaching feedback.

**Positioning:** "A SQL practice platform that helps you master interview SQL, business SQL, and production-style data engineering SQL through realistic problems, hidden testcase rigor, and deep learning feedback."

---

## Appendix C: First 15 MVP Problem Themes

**Interview mode**
1. Second highest salary
2. Top customer by spend
3. Duplicate emails
4. Consecutive logins
5. Department highest salary

**Analytics mode**
6. Weekly active users
7. Conversion funnel by channel
8. Customer retention by cohort
9. Average order value by month
10. Experiment uplift summary

**Data Engineering mode**
11. Deduplicate CDC records
12. Latest record per business key
13. Source-target row count reconciliation
14. Daily incremental load using watermark
15. SCD Type 2 change capture

**Recommended initial problem count:** 30 interview + 25 analytics + 20 DE = **75 problems**
