"""
SQL allowlist guard. Uses sqlglot to parse the AST and reject anything
that is not a single SELECT (or WITH...SELECT) statement.
"""
import sqlglot
import sqlglot.expressions as exp


class SqlNotAllowedError(ValueError):
    pass


def validate_sql(sql: str) -> None:
    sql = sql.strip()
    if not sql:
        raise SqlNotAllowedError("SQL cannot be empty.")

    try:
        statements = sqlglot.parse(sql, error_level=sqlglot.ErrorLevel.RAISE)
    except sqlglot.errors.ParseError as e:
        raise SqlNotAllowedError(f"SQL parse error: {e}")

    if len(statements) != 1:
        raise SqlNotAllowedError("Submit exactly one SQL statement.")

    stmt = statements[0]

    # Allow WITH (CTE) only if the final expression is a SELECT
    if isinstance(stmt, exp.With):
        inner = stmt.this
        if not isinstance(inner, exp.Select):
            raise SqlNotAllowedError("Only SELECT statements are allowed.")
        stmt = inner

    if not isinstance(stmt, exp.Select):
        raise SqlNotAllowedError("Only SELECT statements are allowed.")

    # Walk the AST and block any DML/DDL nodes
    _BLOCKED_TYPES = (
        exp.Insert,
        exp.Update,
        exp.Delete,
        exp.Drop,
        exp.Alter,
        exp.Create,
        exp.Command,
    )
    for node in stmt.walk():
        if isinstance(node, _BLOCKED_TYPES):
            raise SqlNotAllowedError(f"Statement type '{type(node).__name__}' is not allowed.")
