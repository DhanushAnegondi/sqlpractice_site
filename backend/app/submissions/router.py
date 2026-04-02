from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.problem import Problem
from app.models.submission import Submission, UserProblemProgress
from app.models.user import User
from app.submissions.schemas import ProgressOut, SubmissionOut

router = APIRouter()


@router.get("/me/submissions", response_model=list[SubmissionOut])
async def my_submissions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Submission)
        .where(Submission.user_id == current_user.id)
        .order_by(Submission.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    submissions = result.scalars().all()
    return [
        SubmissionOut(
            id=str(s.id),
            problem_id=str(s.problem_id),
            status=s.status,
            execution_time_ms=s.execution_time_ms,
            created_at=s.created_at,
        )
        for s in submissions
    ]


@router.get("/me/progress", response_model=list[ProgressOut])
async def my_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserProblemProgress, Problem)
        .join(Problem, Problem.id == UserProblemProgress.problem_id)
        .where(UserProblemProgress.user_id == current_user.id)
        .order_by(UserProblemProgress.last_attempt_at.desc())
    )
    rows = result.all()
    return [
        ProgressOut(
            problem_id=str(progress.problem_id),
            slug=problem.slug,
            title=problem.title,
            best_status=progress.best_status,
            total_attempts=progress.total_attempts,
            solved_at=progress.solved_at,
            last_attempt_at=progress.last_attempt_at,
        )
        for progress, problem in rows
    ]
