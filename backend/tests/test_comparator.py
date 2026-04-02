from app.execution.comparator import ComparisonConfig, compare_results


class TestComparator:
    def test_exact_match(self):
        actual = [{"email": "a@b.com"}]
        expected = [{"email": "a@b.com"}]
        result = compare_results(actual, expected)
        assert result.passed

    def test_order_insensitive(self):
        actual = [{"email": "b@b.com"}, {"email": "a@b.com"}]
        expected = [{"email": "a@b.com"}, {"email": "b@b.com"}]
        result = compare_results(actual, expected, ComparisonConfig(order_sensitive=False))
        assert result.passed

    def test_order_sensitive_fail(self):
        actual = [{"email": "b@b.com"}, {"email": "a@b.com"}]
        expected = [{"email": "a@b.com"}, {"email": "b@b.com"}]
        result = compare_results(actual, expected, ComparisonConfig(order_sensitive=True))
        assert not result.passed
        assert result.failure_category == "ordering_mismatch"

    def test_null_handling(self):
        actual = [{"email": "a@b.com"}]
        expected = [{"email": None}]
        result = compare_results(actual, expected)
        assert not result.passed
        assert result.failure_category == "missing_null_handling"

    def test_extra_rows_duplicate_join(self):
        actual = [{"id": 1}, {"id": 1}, {"id": 2}]
        expected = [{"id": 1}, {"id": 2}]
        result = compare_results(actual, expected)
        assert not result.passed
        assert result.failure_category in ("duplicate_rows_after_join", "missing_deduplication")

    def test_fewer_rows(self):
        actual = [{"id": 1}]
        expected = [{"id": 1}, {"id": 2}]
        result = compare_results(actual, expected)
        assert not result.passed
        assert result.failure_category == "incorrect_grouping_grain"

    def test_wrong_columns(self):
        actual = [{"name": "alice"}]
        expected = [{"email": "alice@b.com"}]
        result = compare_results(actual, expected)
        assert not result.passed
        assert result.failure_category == "wrong_columns"

    def test_both_empty(self):
        result = compare_results([], [])
        assert result.passed

    def test_numeric_tolerance(self):
        actual = [{"total": 100.001}]
        expected = [{"total": 100.0}]
        result = compare_results(actual, expected, ComparisonConfig(numeric_tolerance=0.01))
        assert result.passed
