"""
Result normalization and comparison.

comparison_config fields (all optional, default shown):
  order_sensitive: bool = False
  numeric_tolerance: float = 0.0
  duplicate_sensitive: bool = True
  null_sensitive: bool = True
"""
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ComparisonConfig:
    order_sensitive: bool = False
    numeric_tolerance: float = 0.0
    duplicate_sensitive: bool = True
    null_sensitive: bool = True

    @classmethod
    def from_dict(cls, d: dict) -> "ComparisonConfig":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})


@dataclass
class ComparisonResult:
    passed: bool
    failure_category: str | None = None
    details: str | None = None


def _normalize_value(v: Any, tolerance: float) -> Any:
    if v is None:
        return None
    if isinstance(v, float) and tolerance > 0:
        return round(v / tolerance) * tolerance
    return v


def _normalize_row(row: dict, tolerance: float) -> tuple:
    return tuple(
        (k.lower(), _normalize_value(v, tolerance))
        for k, v in sorted(row.items(), key=lambda x: x[0].lower())
    )


def _rows_to_sortable(rows: list[dict], tolerance: float) -> list[tuple]:
    return [_normalize_row(r, tolerance) for r in rows]


def compare_results(
    actual: list[dict],
    expected: list[dict],
    config: ComparisonConfig | None = None,
) -> ComparisonResult:
    if config is None:
        config = ComparisonConfig()

    if not actual and not expected:
        return ComparisonResult(passed=True)

    # Check column sets match (use first row)
    if actual and expected:
        actual_cols = {k.lower() for k in actual[0]}
        expected_cols = {k.lower() for k in expected[0]}
        if actual_cols != expected_cols:
            return ComparisonResult(
                passed=False,
                failure_category="wrong_columns",
                details=f"Expected columns {expected_cols}, got {actual_cols}",
            )

    actual_norm = _rows_to_sortable(actual, config.numeric_tolerance)
    expected_norm = _rows_to_sortable(expected, config.numeric_tolerance)

    if not config.order_sensitive:
        actual_norm = sorted(actual_norm)
        expected_norm = sorted(expected_norm)

    if config.duplicate_sensitive:
        passed = actual_norm == expected_norm
    else:
        passed = sorted(set(actual_norm)) == sorted(set(expected_norm))

    if passed:
        return ComparisonResult(passed=True)

    # Classify the failure
    from app.execution.classifier import classify_failure
    category = classify_failure(actual, expected, config)
    return ComparisonResult(passed=False, failure_category=category)
