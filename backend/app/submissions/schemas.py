from datetime import datetime

from pydantic import BaseModel


class SubmissionOut(BaseModel):
    id: str
    problem_id: str
    status: str
    execution_time_ms: int | None
    created_at: datetime


class ProgressOut(BaseModel):
    problem_id: str
    slug: str
    title: str
    best_status: str | None
    total_attempts: int
    solved_at: datetime | None
    last_attempt_at: datetime | None
