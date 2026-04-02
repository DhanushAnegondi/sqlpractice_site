import time
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.execution.allowlist import SqlNotAllowedError, validate_sql
from app.execution.comparator import ComparisonConfig, compare_results
from app.execution.sandbox import run_in_sandbox
from app.execution.schemas import FeedbackDetail, RunRequest, RunResult, SubmitRequest, SubmitResult
from app.models.problem import Dataset, ExpectedResult, Problem
from app.models.submission import Submission, SubmissionTestResult, UserProblemProgress
from app.models.user import User
from app.problems.service import get_problem_by_slug

router = APIRouter()

_FAILURE_FEEDBACK = {
    "duplicate_rows_after_join": (
        "Your query returns more rows than expected, likely due to a fan-out join.",
        "Check the grain of each table before joining. Consider deduplicating or pre-aggregating the driving table.",
    ),
    "missing_deduplication": (
        "Your query returns duplicate rows.",
        "Add a DISTINCT or use ROW_NUMBER() to deduplicate before returning results.",
    ),
    "incorrect_grouping_grain": (
        "Your query returns fewer rows than expected.",
        "Check your GROUP BY clause — you may be grouping at too coarse a grain.",
    ),
    "missing_null_handling": (
        "Your query does not handle NULL values correctly.",
        "Use COALESCE, IS NULL, or NULL-safe comparisons where NULLs may appear.",
    ),
    "ordering_mismatch": (
        "Your rows are correct but in the wrong order.",
        "Add or fix your ORDER BY clause to match the expected output.",
    ),
    "wrong_columns": (
        "Your query returns different columns than expected.",
        "Check your SELECT list and column aliases against the expected output.",
    ),
    "wrong_output": (
        "Your query output does not match the expected result.",
        "Review your logic against the sample data and edge cases.",
    ),
}


def _build_schema_ddl(problem: Problem) -> str:
    lines = []
    for st in problem.schema_tables:
        cols = ", ".join(
            f"{col['name']} {col['type']}" for col in st.column_definitions
        )
        lines.append(f"CREATE TABLE {st.table_name} ({cols});")
    return "\n".join(lines)


@router.post("/{slug}/run", response_model=RunResult)
async def run_query(
    slug: str,
    body: RunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    problem = await get_problem_by_slug(db, slug)
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    try:
        validate_sql(body.sql)
    except SqlNotAllowedError as e:
        return RunResult(columns=[], rows=[], execution_time_ms=0, error=str(e))

    sample_dataset = next((d for d in problem.datasets if d.type == "sample"), None)
    if not sample_dataset:
        raise HTTPException(status_code=500, detail="No sample dataset configured for this problem")

    schema_ddl = _build_schema_ddl(problem)
    start = time.monotonic()
    try:
        rows = await run_in_sandbox(schema_ddl, sample_dataset.fixture_data, body.sql)
    except (TimeoutError, RuntimeError) as e:
        return RunResult(columns=[], rows=[], execution_time_ms=0, error=str(e))

    elapsed_ms = int((time.monotonic() - start) * 1000)
    columns = list(rows[0].keys()) if rows else []
    return RunResult(columns=columns, rows=rows[:200], execution_time_ms=elapsed_ms)


@router.post("/{slug}/submit", response_model=SubmitResult)
async def submit_query(
    slug: str,
    body: SubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    problem = await get_problem_by_slug(db, slug)
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    # Validate SQL first
    try:
        validate_sql(body.sql)
    except SqlNotAllowedError as e:
        submission = Submission(
            user_id=current_user.id,
            problem_id=problem.id,
            submitted_sql=body.sql,
            status="error",
            error_type="sql_not_allowed",
            feedback={"error": str(e)},
        )
        db.add(submission)
        await db.commit()
        await db.refresh(submission)
        return SubmitResult(
            submission_id=str(submission.id),
            status="error",
            passed_visible=False,
            passed_hidden=False,
            failure_categories=[],
            execution_time_ms=0,
            hint_unlock_available=False,
            error=str(e),
        )

    schema_ddl = _build_schema_ddl(problem)
    testcase_datasets = [d for d in problem.datasets if d.type in ("visible_testcase", "hidden_testcase")]

    test_results = []
    failure_categories: list[str] = []
    total_ms = 0

    for dataset in testcase_datasets:
        # Load expected result
        result = await db.execute(
            select(ExpectedResult).where(ExpectedResult.dataset_id == dataset.id)
        )
        expected_result = result.scalar_one_or_none()
        if not expected_result:
            continue

        config = ComparisonConfig.from_dict(expected_result.comparison_config or {})

        start = time.monotonic()
        try:
            actual_rows = await run_in_sandbox(schema_ddl, dataset.fixture_data, body.sql)
            exec_ms = int((time.monotonic() - start) * 1000)
            comparison = compare_results(actual_rows, expected_result.expected_output, config)
            passed = comparison.passed
            failure_cat = comparison.failure_category
        except (TimeoutError, RuntimeError) as e:
            exec_ms = int((time.monotonic() - start) * 1000)
            passed = False
            failure_cat = "execution_error"

        total_ms += exec_ms
        if failure_cat and failure_cat not in failure_categories:
            failure_categories.append(failure_cat)

        test_results.append(
            SubmissionTestResult(
                dataset_id=dataset.id,
                passed=passed,
                failure_category=failure_cat,
                execution_time_ms=exec_ms,
            )
        )

    passed_visible = all(r.passed for r in test_results if _dataset_type(testcase_datasets, r.dataset_id) == "visible_testcase")
    passed_hidden = all(r.passed for r in test_results if _dataset_type(testcase_datasets, r.dataset_id) == "hidden_testcase")
    overall_status = "accepted" if (passed_visible and passed_hidden) else "failed"

    # Build feedback
    feedback = None
    if failure_categories:
        primary = failure_categories[0]
        summary, next_step = _FAILURE_FEEDBACK.get(primary, ("Your query did not pass all testcases.", "Review the problem statement and edge cases."))
        feedback = {"summary": summary, "next_step": next_step}

    # Persist submission
    submission = Submission(
        user_id=current_user.id,
        problem_id=problem.id,
        submitted_sql=body.sql,
        status=overall_status,
        execution_time_ms=total_ms,
        feedback=feedback,
    )
    db.add(submission)
    await db.flush()

    for tr in test_results:
        tr.submission_id = submission.id
        db.add(tr)

    # Upsert progress
    progress = await db.scalar(
        select(UserProblemProgress).where(
            UserProblemProgress.user_id == current_user.id,
            UserProblemProgress.problem_id == problem.id,
        )
    )
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    if not progress:
        progress = UserProblemProgress(
            user_id=current_user.id,
            problem_id=problem.id,
            first_attempt_at=now,
            total_attempts=1,
            best_status=overall_status,
            last_attempt_at=now,
        )
        if overall_status == "accepted":
            progress.solved_at = now
        db.add(progress)
    else:
        progress.total_attempts += 1
        progress.last_attempt_at = now
        if overall_status == "accepted" and progress.best_status != "accepted":
            progress.best_status = "accepted"
            progress.solved_at = now

    await db.commit()
    await db.refresh(submission)

    hint_available = overall_status != "accepted"
    return SubmitResult(
        submission_id=str(submission.id),
        status=overall_status,
        passed_visible=passed_visible,
        passed_hidden=passed_hidden,
        failure_categories=failure_categories,
        execution_time_ms=total_ms,
        hint_unlock_available=hint_available,
        feedback=FeedbackDetail(**feedback) if feedback else None,
    )


def _dataset_type(datasets: list, dataset_id) -> str:
    for d in datasets:
        if d.id == dataset_id:
            return d.type
    return ""
