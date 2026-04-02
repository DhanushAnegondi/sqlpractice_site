"""
Run from backend/ directory:
    python scripts/seed_problems.py

Seeds the initial 3 problems to prove the full pipeline works.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.problem import Dataset, Editorial, ExpectedResult, Hint, Problem, SchemaTable, Tag, ProblemTag

engine = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

PROBLEMS = [
    {
        "slug": "duplicate-emails",
        "title": "Duplicate Emails",
        "description": (
            "## Problem\n\n"
            "Given a `person` table, write a SQL query to find all emails "
            "that appear more than once.\n\n"
            "### Schema\n\n"
            "```\nperson(id INTEGER, email VARCHAR)\n```\n\n"
            "### Expected Output\n\n"
            "Return a single column `email` containing each duplicate email once."
        ),
        "mode": "interview",
        "difficulty": "easy",
        "dialect": "postgresql",
        "estimated_time_minutes": 10,
        "tags": [{"name": "aggregation", "category": "topic"}, {"name": "group-by", "category": "topic"}],
        "schema_tables": [
            {
                "table_name": "person",
                "column_definitions": [
                    {"name": "id", "type": "INTEGER", "nullable": False},
                    {"name": "email", "type": "VARCHAR", "nullable": True},
                ],
            }
        ],
        "datasets": [
            {
                "name": "sample",
                "type": "sample",
                "fixture_data": {
                    "person": [
                        {"id": 1, "email": "alice@example.com"},
                        {"id": 2, "email": "bob@example.com"},
                        {"id": 3, "email": "alice@example.com"},
                    ]
                },
                "expected": None,
                "comparison_config": None,
            },
            {
                "name": "visible_testcase_1",
                "type": "visible_testcase",
                "fixture_data": {
                    "person": [
                        {"id": 1, "email": "alice@example.com"},
                        {"id": 2, "email": "bob@example.com"},
                        {"id": 3, "email": "alice@example.com"},
                    ]
                },
                "expected": [{"email": "alice@example.com"}],
                "comparison_config": {"order_sensitive": False, "duplicate_sensitive": True},
            },
            {
                "name": "hidden_testcase_nulls",
                "type": "hidden_testcase",
                "fixture_data": {
                    "person": [
                        {"id": 1, "email": None},
                        {"id": 2, "email": None},
                        {"id": 3, "email": "x@y.com"},
                    ]
                },
                "expected": [{"email": None}],
                "comparison_config": {"order_sensitive": False, "duplicate_sensitive": True},
            },
            {
                "name": "hidden_testcase_multiple_dupes",
                "type": "hidden_testcase",
                "fixture_data": {
                    "person": [
                        {"id": 1, "email": "a@b.com"},
                        {"id": 2, "email": "a@b.com"},
                        {"id": 3, "email": "c@d.com"},
                        {"id": 4, "email": "c@d.com"},
                        {"id": 5, "email": "e@f.com"},
                    ]
                },
                "expected": [{"email": "a@b.com"}, {"email": "c@d.com"}],
                "comparison_config": {"order_sensitive": False, "duplicate_sensitive": True},
            },
        ],
        "hints": [
            {"hint_level": 1, "content": "Think about how to count how many times each email appears."},
            {"hint_level": 2, "content": "Use GROUP BY email and count the rows per group."},
            {"hint_level": 3, "content": "Use HAVING COUNT(*) > 1 to filter groups with duplicates."},
        ],
        "editorial": {
            "canonical_solution_sql": "SELECT email FROM person GROUP BY email HAVING COUNT(*) > 1;",
            "explanation_markdown": (
                "## Solution\n\n"
                "Group all rows by `email` and keep only groups where more than one row exists.\n\n"
                "```sql\nSELECT email\nFROM person\nGROUP BY email\nHAVING COUNT(*) > 1;\n```\n\n"
                "### Why HAVING and not WHERE?\n\n"
                "`WHERE` filters individual rows before grouping. "
                "`HAVING` filters groups after aggregation — which is what we need here.\n\n"
                "### NULL handling\n\n"
                "NULL emails will appear in the same group (GROUP BY treats NULLs as equal). "
                "If two rows have NULL email, `HAVING COUNT(*) > 1` will correctly include NULL."
            ),
            "alternative_solutions": [
                {
                    "label": "Using subquery",
                    "sql": "SELECT DISTINCT email FROM person WHERE email IN (SELECT email FROM person GROUP BY email HAVING COUNT(*) > 1);",
                }
            ],
            "anti_patterns": [
                {
                    "label": "Using DISTINCT without grouping",
                    "sql": "SELECT DISTINCT email FROM person;",
                    "why_wrong": "DISTINCT removes all duplicates — it returns every email once, not just the duplicates.",
                }
            ],
        },
    },
    {
        "slug": "top-customer-by-spend",
        "title": "Top Customer by Spend",
        "description": (
            "## Problem\n\n"
            "Given an `orders` table, find the customer with the highest total spend.\n\n"
            "Return `customer_id` and `total_spend`. If there is a tie, return all tied customers.\n\n"
            "### Schema\n\n"
            "```\norders(order_id INTEGER, customer_id INTEGER, amount DECIMAL)\n```"
        ),
        "mode": "interview",
        "difficulty": "medium",
        "dialect": "postgresql",
        "estimated_time_minutes": 15,
        "tags": [{"name": "aggregation", "category": "topic"}, {"name": "ranking", "category": "topic"}, {"name": "window-functions", "category": "topic"}],
        "schema_tables": [
            {
                "table_name": "orders",
                "column_definitions": [
                    {"name": "order_id", "type": "INTEGER", "nullable": False},
                    {"name": "customer_id", "type": "INTEGER", "nullable": False},
                    {"name": "amount", "type": "DECIMAL", "nullable": True},
                ],
            }
        ],
        "datasets": [
            {
                "name": "sample",
                "type": "sample",
                "fixture_data": {
                    "orders": [
                        {"order_id": 1, "customer_id": 1, "amount": 100.00},
                        {"order_id": 2, "customer_id": 2, "amount": 200.00},
                        {"order_id": 3, "customer_id": 1, "amount": 150.00},
                        {"order_id": 4, "customer_id": 3, "amount": 50.00},
                    ]
                },
                "expected": None,
                "comparison_config": None,
            },
            {
                "name": "visible_testcase_1",
                "type": "visible_testcase",
                "fixture_data": {
                    "orders": [
                        {"order_id": 1, "customer_id": 1, "amount": 100.00},
                        {"order_id": 2, "customer_id": 2, "amount": 200.00},
                        {"order_id": 3, "customer_id": 1, "amount": 150.00},
                        {"order_id": 4, "customer_id": 3, "amount": 50.00},
                    ]
                },
                "expected": [{"customer_id": 1, "total_spend": 250.00}],
                "comparison_config": {"order_sensitive": False, "numeric_tolerance": 0.01},
            },
            {
                "name": "hidden_testcase_tie",
                "type": "hidden_testcase",
                "fixture_data": {
                    "orders": [
                        {"order_id": 1, "customer_id": 1, "amount": 300.00},
                        {"order_id": 2, "customer_id": 2, "amount": 300.00},
                        {"order_id": 3, "customer_id": 3, "amount": 100.00},
                    ]
                },
                "expected": [{"customer_id": 1, "total_spend": 300.00}, {"customer_id": 2, "total_spend": 300.00}],
                "comparison_config": {"order_sensitive": False, "numeric_tolerance": 0.01},
            },
            {
                "name": "hidden_testcase_nulls",
                "type": "hidden_testcase",
                "fixture_data": {
                    "orders": [
                        {"order_id": 1, "customer_id": 1, "amount": None},
                        {"order_id": 2, "customer_id": 1, "amount": 200.00},
                        {"order_id": 3, "customer_id": 2, "amount": 150.00},
                    ]
                },
                "expected": [{"customer_id": 1, "total_spend": 200.00}],
                "comparison_config": {"order_sensitive": False, "numeric_tolerance": 0.01},
            },
        ],
        "hints": [
            {"hint_level": 1, "content": "Start by calculating the total spend per customer."},
            {"hint_level": 2, "content": "Use GROUP BY customer_id with SUM(amount) to get totals."},
            {"hint_level": 3, "content": "Use RANK() OVER (ORDER BY total_spend DESC) or a subquery with MAX to handle ties."},
        ],
        "editorial": {
            "canonical_solution_sql": (
                "WITH spend AS (\n"
                "  SELECT customer_id, SUM(amount) AS total_spend\n"
                "  FROM orders\n"
                "  GROUP BY customer_id\n"
                ")\n"
                "SELECT customer_id, total_spend\n"
                "FROM spend\n"
                "WHERE total_spend = (SELECT MAX(total_spend) FROM spend);"
            ),
            "explanation_markdown": (
                "## Solution\n\n"
                "First aggregate total spend per customer, then filter to keep only the maximum.\n\n"
                "The subquery `SELECT MAX(total_spend) FROM spend` returns a single value — "
                "any customer matching that value is included, naturally handling ties."
            ),
            "alternative_solutions": [
                {
                    "label": "Using RANK()",
                    "sql": (
                        "WITH ranked AS (\n"
                        "  SELECT customer_id, SUM(amount) AS total_spend,\n"
                        "         RANK() OVER (ORDER BY SUM(amount) DESC) AS rnk\n"
                        "  FROM orders GROUP BY customer_id\n"
                        ")\n"
                        "SELECT customer_id, total_spend FROM ranked WHERE rnk = 1;"
                    ),
                }
            ],
            "anti_patterns": [],
        },
    },
    {
        "slug": "deduplicate-cdc-records",
        "title": "Deduplicate CDC Records",
        "description": (
            "## Problem\n\n"
            "You receive a CDC (Change Data Capture) stream in a `cdc_events` table. "
            "Each row represents a change event for a business key. "
            "Multiple events may exist for the same `business_key`.\n\n"
            "Write a query to return the **latest record per business key** "
            "based on `event_timestamp`.\n\n"
            "### Schema\n\n"
            "```\ncdc_events(\n"
            "  event_id INTEGER,\n"
            "  business_key VARCHAR,\n"
            "  payload VARCHAR,\n"
            "  event_timestamp TIMESTAMP\n"
            ")\n```\n\n"
            "### Expected Output\n\n"
            "Return `business_key`, `payload`, and `event_timestamp` for the latest event per key."
        ),
        "mode": "data_engineering",
        "difficulty": "medium",
        "dialect": "postgresql",
        "estimated_time_minutes": 20,
        "tags": [{"name": "deduplication", "category": "topic"}, {"name": "window-functions", "category": "topic"}, {"name": "cdc", "category": "topic"}],
        "schema_tables": [
            {
                "table_name": "cdc_events",
                "column_definitions": [
                    {"name": "event_id", "type": "INTEGER", "nullable": False},
                    {"name": "business_key", "type": "VARCHAR", "nullable": False},
                    {"name": "payload", "type": "VARCHAR", "nullable": True},
                    {"name": "event_timestamp", "type": "TIMESTAMP", "nullable": False},
                ],
            }
        ],
        "datasets": [
            {
                "name": "sample",
                "type": "sample",
                "fixture_data": {
                    "cdc_events": [
                        {"event_id": 1, "business_key": "K1", "payload": "v1", "event_timestamp": "2024-01-01 10:00:00"},
                        {"event_id": 2, "business_key": "K1", "payload": "v2", "event_timestamp": "2024-01-01 11:00:00"},
                        {"event_id": 3, "business_key": "K2", "payload": "v3", "event_timestamp": "2024-01-01 09:00:00"},
                    ]
                },
                "expected": None,
                "comparison_config": None,
            },
            {
                "name": "visible_testcase_1",
                "type": "visible_testcase",
                "fixture_data": {
                    "cdc_events": [
                        {"event_id": 1, "business_key": "K1", "payload": "v1", "event_timestamp": "2024-01-01 10:00:00"},
                        {"event_id": 2, "business_key": "K1", "payload": "v2", "event_timestamp": "2024-01-01 11:00:00"},
                        {"event_id": 3, "business_key": "K2", "payload": "v3", "event_timestamp": "2024-01-01 09:00:00"},
                    ]
                },
                "expected": [
                    {"business_key": "K1", "payload": "v2", "event_timestamp": "2024-01-01 11:00:00"},
                    {"business_key": "K2", "payload": "v3", "event_timestamp": "2024-01-01 09:00:00"},
                ],
                "comparison_config": {"order_sensitive": False},
            },
            {
                "name": "hidden_testcase_out_of_order",
                "type": "hidden_testcase",
                "fixture_data": {
                    "cdc_events": [
                        {"event_id": 3, "business_key": "K1", "payload": "v3", "event_timestamp": "2024-01-03 08:00:00"},
                        {"event_id": 1, "business_key": "K1", "payload": "v1", "event_timestamp": "2024-01-01 08:00:00"},
                        {"event_id": 2, "business_key": "K1", "payload": "v2", "event_timestamp": "2024-01-02 08:00:00"},
                    ]
                },
                "expected": [
                    {"business_key": "K1", "payload": "v3", "event_timestamp": "2024-01-03 08:00:00"},
                ],
                "comparison_config": {"order_sensitive": False},
            },
        ],
        "hints": [
            {"hint_level": 1, "content": "You need exactly one row per business_key — the one with the latest event_timestamp."},
            {"hint_level": 2, "content": "Use ROW_NUMBER() OVER (PARTITION BY business_key ORDER BY event_timestamp DESC) to rank events."},
            {"hint_level": 3, "content": "Wrap the ROW_NUMBER in a CTE or subquery, then filter WHERE rn = 1."},
        ],
        "editorial": {
            "canonical_solution_sql": (
                "WITH ranked AS (\n"
                "  SELECT business_key, payload, event_timestamp,\n"
                "         ROW_NUMBER() OVER (\n"
                "           PARTITION BY business_key\n"
                "           ORDER BY event_timestamp DESC\n"
                "         ) AS rn\n"
                "  FROM cdc_events\n"
                ")\n"
                "SELECT business_key, payload, event_timestamp\n"
                "FROM ranked\n"
                "WHERE rn = 1;"
            ),
            "explanation_markdown": (
                "## Solution\n\n"
                "This is the canonical **latest-record-per-group** pattern — "
                "one of the most common patterns in data engineering.\n\n"
                "1. Use `ROW_NUMBER()` partitioned by `business_key`, ordered by `event_timestamp DESC`.\n"
                "2. Row 1 in each partition = the latest event for that key.\n"
                "3. Filter `WHERE rn = 1` to keep only the latest.\n\n"
                "### Why ROW_NUMBER and not MAX?\n\n"
                "A `GROUP BY` + `MAX(event_timestamp)` would give you the timestamp, "
                "but not the other columns from the latest row without an additional join. "
                "`ROW_NUMBER()` gives you the full row in one pass.\n\n"
                "### Production note\n\n"
                "In a real warehouse, this pattern is used inside MERGE statements "
                "to apply CDC streams to target tables."
            ),
            "alternative_solutions": [],
            "anti_patterns": [
                {
                    "label": "MAX without window function",
                    "sql": "SELECT business_key, payload, MAX(event_timestamp) FROM cdc_events GROUP BY business_key, payload;",
                    "why_wrong": "Grouping by payload means different payloads become separate groups — you won't get one row per key.",
                }
            ],
        },
    },
]


async def get_or_create_tag(db: AsyncSession, name: str, category: str | None) -> Tag:
    tag = await db.scalar(select(Tag).where(Tag.name == name))
    if not tag:
        tag = Tag(name=name, category=category)
        db.add(tag)
        await db.flush()
    return tag


async def seed(db: AsyncSession):
    for p_data in PROBLEMS:
        existing = await db.scalar(select(Problem).where(Problem.slug == p_data["slug"]))
        if existing:
            print(f"  Skipping '{p_data['slug']}' (already exists)")
            continue

        print(f"  Seeding '{p_data['slug']}'...")

        problem = Problem(
            slug=p_data["slug"],
            title=p_data["title"],
            description=p_data["description"],
            mode=p_data["mode"],
            difficulty=p_data["difficulty"],
            dialect=p_data["dialect"],
            estimated_time_minutes=p_data["estimated_time_minutes"],
            status="published",
        )
        db.add(problem)
        await db.flush()

        # Tags
        for t in p_data["tags"]:
            tag = await get_or_create_tag(db, t["name"], t["category"])
            db.add(ProblemTag(problem_id=problem.id, tag_id=tag.id))

        # Schema tables
        for st in p_data["schema_tables"]:
            db.add(SchemaTable(problem_id=problem.id, **st))

        # Datasets + expected results
        for ds in p_data["datasets"]:
            dataset = Dataset(
                problem_id=problem.id,
                name=ds["name"],
                type=ds["type"],
                fixture_data=ds["fixture_data"],
                validator_config=ds.get("comparison_config"),
            )
            db.add(dataset)
            await db.flush()

            if ds["expected"] is not None:
                db.add(ExpectedResult(
                    dataset_id=dataset.id,
                    expected_output=ds["expected"],
                    comparison_config=ds.get("comparison_config") or {},
                ))

        # Hints
        from app.models.problem import Hint
        for h in p_data["hints"]:
            db.add(Hint(problem_id=problem.id, **h))

        # Editorial
        from app.models.problem import Editorial
        ed = p_data["editorial"]
        db.add(Editorial(
            problem_id=problem.id,
            canonical_solution_sql=ed["canonical_solution_sql"],
            explanation_markdown=ed.get("explanation_markdown"),
            alternative_solutions=ed.get("alternative_solutions"),
            anti_patterns=ed.get("anti_patterns"),
        ))

    await db.commit()
    print("Done.")


async def main():
    async with SessionLocal() as db:
        await seed(db)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
