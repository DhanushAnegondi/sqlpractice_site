from pydantic import BaseModel


class TagOut(BaseModel):
    name: str
    category: str | None


class ColumnDef(BaseModel):
    name: str
    type: str
    nullable: bool = True


class SchemaTableOut(BaseModel):
    table_name: str
    columns: list[ColumnDef]


class ProblemListItem(BaseModel):
    id: str
    slug: str
    title: str
    mode: str
    difficulty: str
    estimated_time_minutes: int | None
    tags: list[TagOut]


class SampleRow(dict):
    pass


class ProblemDetail(BaseModel):
    id: str
    slug: str
    title: str
    description: str
    mode: str
    difficulty: str
    dialect: str
    estimated_time_minutes: int | None
    tags: list[TagOut]
    schema_tables: list[SchemaTableOut]
    sample_data: dict[str, list[dict]]  # table_name -> rows


class ProblemListResponse(BaseModel):
    items: list[ProblemListItem]
    total: int
