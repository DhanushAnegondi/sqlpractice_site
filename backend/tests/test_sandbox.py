import pytest
from app.execution.sandbox import run_in_sandbox
from app.execution.allowlist import validate_sql, SqlNotAllowedError


class TestAllowlist:
    def test_allows_select(self):
        validate_sql("SELECT * FROM person")

    def test_allows_cte(self):
        validate_sql("WITH t AS (SELECT id FROM person) SELECT * FROM t")

    def test_blocks_insert(self):
        with pytest.raises(SqlNotAllowedError):
            validate_sql("INSERT INTO person VALUES (1, 'a@b.com')")

    def test_blocks_drop(self):
        with pytest.raises(SqlNotAllowedError):
            validate_sql("DROP TABLE person")

    def test_blocks_multiple_statements(self):
        with pytest.raises(SqlNotAllowedError):
            validate_sql("SELECT 1; SELECT 2")

    def test_blocks_empty(self):
        with pytest.raises(SqlNotAllowedError):
            validate_sql("")


class TestSandbox:
    async def test_basic_select(self, simple_schema_ddl, person_fixture):
        rows = await run_in_sandbox(simple_schema_ddl, person_fixture, "SELECT * FROM person")
        assert len(rows) == 3

    async def test_duplicate_emails(self, simple_schema_ddl, person_fixture):
        rows = await run_in_sandbox(
            simple_schema_ddl,
            person_fixture,
            "SELECT email FROM person GROUP BY email HAVING COUNT(*) > 1",
        )
        assert len(rows) == 1
        assert rows[0]["email"] == "alice@example.com"

    async def test_isolation(self, simple_schema_ddl, person_fixture):
        # Run two queries against the same schema — should not share state
        rows1 = await run_in_sandbox(simple_schema_ddl, person_fixture, "SELECT COUNT(*) AS n FROM person")
        rows2 = await run_in_sandbox(simple_schema_ddl, person_fixture, "SELECT COUNT(*) AS n FROM person")
        assert rows1[0]["n"] == rows2[0]["n"] == 3

    async def test_timeout(self, simple_schema_ddl, person_fixture):
        with pytest.raises(TimeoutError):
            await run_in_sandbox(
                simple_schema_ddl,
                person_fixture,
                "SELECT * FROM person",
                timeout_seconds=0,
            )
