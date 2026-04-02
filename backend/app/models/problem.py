import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=True)


class ProblemTag(Base):
    __tablename__ = "problem_tags"

    problem_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("problems.id", ondelete="CASCADE"), primary_key=True
    )
    tag_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    )


class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    mode: Mapped[str] = mapped_column(String(50), nullable=False)  # interview | analytics | data_engineering
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)  # easy | medium | hard
    dialect: Mapped[str] = mapped_column(String(50), default="postgresql")
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft | published
    estimated_time_minutes: Mapped[int] = mapped_column(Integer, nullable=True)
    author_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    tags: Mapped[list["Tag"]] = relationship(
        "Tag", secondary="problem_tags", lazy="selectin"
    )
    schema_tables: Mapped[list["SchemaTable"]] = relationship("SchemaTable", back_populates="problem", lazy="selectin")
    datasets: Mapped[list["Dataset"]] = relationship("Dataset", back_populates="problem", lazy="selectin")
    hints: Mapped[list["Hint"]] = relationship("Hint", back_populates="problem", order_by="Hint.hint_level")
    editorial: Mapped["Editorial"] = relationship("Editorial", back_populates="problem", uselist=False)


class SchemaTable(Base):
    __tablename__ = "schema_tables"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    problem_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False
    )
    table_name: Mapped[str] = mapped_column(String(100), nullable=False)
    column_definitions: Mapped[dict] = mapped_column(JSON, nullable=False)  # [{name, type, nullable}]

    problem: Mapped["Problem"] = relationship("Problem", back_populates="schema_tables")


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    problem_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False)  # sample | visible_testcase | hidden_testcase
    fixture_data: Mapped[dict] = mapped_column(JSON, nullable=False)  # {table_name: [{...rows}]}
    validator_config: Mapped[dict] = mapped_column(JSON, nullable=True)

    problem: Mapped["Problem"] = relationship("Problem", back_populates="datasets")
    expected_result: Mapped["ExpectedResult"] = relationship("ExpectedResult", back_populates="dataset", uselist=False)


class ExpectedResult(Base):
    __tablename__ = "expected_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    expected_output: Mapped[list] = mapped_column(JSON, nullable=False)  # [{col: val}]
    comparison_config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="expected_result")


class Hint(Base):
    __tablename__ = "hints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    problem_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False
    )
    hint_level: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    problem: Mapped["Problem"] = relationship("Problem", back_populates="hints")


class Editorial(Base):
    __tablename__ = "editorials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    problem_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    canonical_solution_sql: Mapped[str] = mapped_column(Text, nullable=False)
    explanation_markdown: Mapped[str] = mapped_column(Text, nullable=True)
    alternative_solutions: Mapped[list] = mapped_column(JSON, nullable=True)
    anti_patterns: Mapped[list] = mapped_column(JSON, nullable=True)

    problem: Mapped["Problem"] = relationship("Problem", back_populates="editorial")
