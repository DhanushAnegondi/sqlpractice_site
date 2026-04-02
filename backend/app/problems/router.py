from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.problems.schemas import ColumnDef, ProblemDetail, ProblemListItem, ProblemListResponse, SchemaTableOut, TagOut
from app.problems.service import extract_sample_data, get_problem_by_slug, list_problems

router = APIRouter()


@router.get("", response_model=ProblemListResponse)
async def get_problems(
    difficulty: str | None = Query(None),
    mode: str | None = Query(None),
    tag: str | None = Query(None),
    search: str | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    problems, total = await list_problems(db, difficulty=difficulty, mode=mode, tag=tag, search=search, offset=offset, limit=limit)
    items = [
        ProblemListItem(
            id=str(p.id),
            slug=p.slug,
            title=p.title,
            mode=p.mode,
            difficulty=p.difficulty,
            estimated_time_minutes=p.estimated_time_minutes,
            tags=[TagOut(name=t.name, category=t.category) for t in p.tags],
        )
        for p in problems
    ]
    return ProblemListResponse(items=items, total=total)


@router.get("/{slug}", response_model=ProblemDetail)
async def get_problem(slug: str, db: AsyncSession = Depends(get_db)):
    problem = await get_problem_by_slug(db, slug)
    if not problem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found")

    schema_tables = [
        SchemaTableOut(
            table_name=s.table_name,
            columns=[ColumnDef(**col) for col in s.column_definitions],
        )
        for s in problem.schema_tables
    ]

    return ProblemDetail(
        id=str(problem.id),
        slug=problem.slug,
        title=problem.title,
        description=problem.description,
        mode=problem.mode,
        difficulty=problem.difficulty,
        dialect=problem.dialect,
        estimated_time_minutes=problem.estimated_time_minutes,
        tags=[TagOut(name=t.name, category=t.category) for t in problem.tags],
        schema_tables=schema_tables,
        sample_data=extract_sample_data(problem),
    )
