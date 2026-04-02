from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.problem import Dataset, Problem, Tag


async def list_problems(
    db: AsyncSession,
    difficulty: str | None = None,
    mode: str | None = None,
    tag: str | None = None,
    search: str | None = None,
    offset: int = 0,
    limit: int = 50,
) -> tuple[list[Problem], int]:
    query = (
        select(Problem)
        .where(Problem.status == "published")
        .options(selectinload(Problem.tags))
    )

    if difficulty:
        query = query.where(Problem.difficulty == difficulty)
    if mode:
        query = query.where(Problem.mode == mode)
    if search:
        query = query.where(Problem.title.ilike(f"%{search}%"))
    if tag:
        query = query.join(Problem.tags).where(Tag.name == tag)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    result = await db.execute(query.offset(offset).limit(limit))
    problems = result.scalars().all()
    return list(problems), total or 0


async def get_problem_by_slug(db: AsyncSession, slug: str) -> Problem | None:
    result = await db.execute(
        select(Problem)
        .where(Problem.slug == slug, Problem.status == "published")
        .options(
            selectinload(Problem.tags),
            selectinload(Problem.schema_tables),
            selectinload(Problem.datasets),
        )
    )
    return result.scalar_one_or_none()


def extract_sample_data(problem: Problem) -> dict[str, list[dict]]:
    for dataset in problem.datasets:
        if dataset.type == "sample":
            return dataset.fixture_data
    return {}
