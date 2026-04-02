"""
DuckDB in-process execution sandbox.

Each call to run_in_sandbox() creates a fully in-memory DuckDB connection,
seeds the fixture data, executes the user SQL, and closes (destroys) the
connection. No state persists between calls.
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor

import duckdb

_executor = ThreadPoolExecutor(max_workers=8, thread_name_prefix="sandbox")

SANDBOX_MEMORY_LIMIT = "256MB"
SANDBOX_THREADS = 1
MAX_RESULT_ROWS = 500


def _run_sync(
    schema_ddl: str,
    fixture_data: dict[str, list[dict]],
    user_sql: str,
) -> list[dict]:
    con = duckdb.connect()  # in-memory, isolated
    try:
        con.execute(f"SET memory_limit='{SANDBOX_MEMORY_LIMIT}'")
        con.execute(f"SET threads={SANDBOX_THREADS}")

        # Create schema
        con.execute(schema_ddl)

        # Seed fixture rows
        for table_name, rows in fixture_data.items():
            if not rows:
                continue
            cols = list(rows[0].keys())
            col_list = ", ".join(cols)
            placeholders = ", ".join(["?" for _ in cols])
            con.executemany(
                f"INSERT INTO {table_name} ({col_list}) VALUES ({placeholders})",
                [list(row.values()) for row in rows],
            )

        result = con.execute(user_sql).fetchmany(MAX_RESULT_ROWS)
        columns = [desc[0] for desc in con.description]
        return [dict(zip(columns, row)) for row in result]
    finally:
        con.close()


async def run_in_sandbox(
    schema_ddl: str,
    fixture_data: dict[str, list[dict]],
    user_sql: str,
    timeout_seconds: int = 10,
) -> list[dict]:
    loop = asyncio.get_event_loop()
    try:
        return await asyncio.wait_for(
            loop.run_in_executor(_executor, _run_sync, schema_ddl, fixture_data, user_sql),
            timeout=timeout_seconds,
        )
    except asyncio.TimeoutError:
        raise TimeoutError(f"Query exceeded {timeout_seconds}s time limit.")
    except duckdb.Error as e:
        raise RuntimeError(str(e))
