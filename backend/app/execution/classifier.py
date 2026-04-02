"""
Heuristic failure category classifier.
Infers likely root cause from the delta between actual and expected outputs.
"""
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.execution.comparator import ComparisonConfig


def classify_failure(
    actual: list[dict],
    expected: list[dict],
    config: "ComparisonConfig",
) -> str:
    actual_count = len(actual)
    expected_count = len(expected)

    # Row count divergence
    if actual_count > expected_count:
        # Check if removing duplicates from actual would match
        actual_deduped = [dict(t) for t in {tuple(sorted(r.items())) for r in actual}]
        if len(actual_deduped) == expected_count:
            return "missing_deduplication"
        return "duplicate_rows_after_join"

    if actual_count < expected_count:
        return "incorrect_grouping_grain"

    # Same row count but wrong values — check for null mismatches
    actual_has_nulls = any(None in r.values() for r in actual)
    expected_has_nulls = any(None in r.values() for r in expected)
    if expected_has_nulls and not actual_has_nulls:
        return "missing_null_handling"

    # Order mismatch (only when order is required)
    if config.order_sensitive:
        from app.execution.comparator import _rows_to_sortable
        a_sorted = sorted(_rows_to_sortable(actual, config.numeric_tolerance))
        e_sorted = sorted(_rows_to_sortable(expected, config.numeric_tolerance))
        if a_sorted == e_sorted:
            return "ordering_mismatch"

    # Numeric precision
    if config.numeric_tolerance > 0:
        return "numeric_precision_mismatch"

    return "wrong_output"
