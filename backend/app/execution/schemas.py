from pydantic import BaseModel


class RunRequest(BaseModel):
    sql: str


class RunResult(BaseModel):
    columns: list[str]
    rows: list[dict]
    execution_time_ms: int
    error: str | None = None


class TestcaseResult(BaseModel):
    dataset_id: str
    dataset_name: str
    type: str  # visible_testcase | hidden_testcase
    passed: bool
    failure_category: str | None = None


class SubmitRequest(BaseModel):
    sql: str


class FeedbackDetail(BaseModel):
    summary: str
    next_step: str


class SubmitResult(BaseModel):
    submission_id: str
    status: str  # accepted | failed | error
    passed_visible: bool
    passed_hidden: bool
    failure_categories: list[str]
    execution_time_ms: int
    hint_unlock_available: bool
    feedback: FeedbackDetail | None = None
    error: str | None = None
