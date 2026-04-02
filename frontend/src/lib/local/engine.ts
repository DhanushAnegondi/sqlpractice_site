"use client";

import { getDuckDb } from "./duckdb";
import type {
  LocalProblem,
  LocalRunResult,
  LocalSubmitResult,
  LocalSubmissionRecord,
} from "./types";

const FAILURE_FEEDBACK: Record<string, { summary: string; next_step: string }> = {
  wrong_columns: {
    summary: "Your query returns different columns than expected.",
    next_step: "Check the SELECT list and aliases against the required output.",
  },
  ordering_mismatch: {
    summary: "Your rows are correct but in the wrong order.",
    next_step: "Add or adjust ORDER BY if the output order matters.",
  },
  wrong_output: {
    summary: "Your query output does not match the expected result.",
    next_step: "Review the grouping, join logic, and edge cases in the sample data.",
  },
};

function escapeIdentifier(value: string) {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function escapeValue(value: unknown) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function prepareProblemDataset(problem: LocalProblem, fixtureData: Record<string, Record<string, unknown>[]>) {
  const db = await getDuckDb();
  const conn = await db.connect();

  for (const table of problem.schema_tables) {
    const columns = table.columns
      .map((column) => `${escapeIdentifier(column.name)} ${column.type}`)
      .join(", ");
    await conn.query(`CREATE OR REPLACE TABLE ${escapeIdentifier(table.table_name)} (${columns});`);

    const rows = fixtureData[table.table_name] ?? [];
    for (const row of rows) {
      const rowColumns = table.columns.map((column) => escapeIdentifier(column.name)).join(", ");
      const rowValues = table.columns
        .map((column) => escapeValue(row[column.name]))
        .join(", ");
      await conn.query(
        `INSERT INTO ${escapeIdentifier(table.table_name)} (${rowColumns}) VALUES (${rowValues});`,
      );
    }
  }

  return conn;
}

function normalizeValue(value: unknown) {
  if (value instanceof Date) return value.toISOString().replace("T", " ").slice(0, 19);
  return value;
}

function normalizeRows(
  rows: Record<string, unknown>[],
  orderSensitive: boolean,
) {
  const normalized = rows.map((row) => {
    const next: Record<string, unknown> = {};
    Object.keys(row)
      .sort()
      .forEach((key) => {
        next[key] = normalizeValue(row[key]);
      });
    return next;
  });

  if (orderSensitive) return normalized;

  return normalized.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function valuesMatch(left: unknown, right: unknown, tolerance?: number) {
  if (typeof left === "number" && typeof right === "number" && tolerance !== undefined) {
    return Math.abs(left - right) <= tolerance;
  }
  return left === right;
}

function compareRows(
  actual: Record<string, unknown>[],
  expected: Record<string, unknown>[],
  options: { order_sensitive?: boolean; numeric_tolerance?: number } = {},
) {
  const orderSensitive = options.order_sensitive ?? false;
  const actualRows = normalizeRows(actual, orderSensitive);
  const expectedRows = normalizeRows(expected, orderSensitive);

  const actualColumns = actualRows[0] ? Object.keys(actualRows[0]).sort() : [];
  const expectedColumns = expectedRows[0] ? Object.keys(expectedRows[0]).sort() : [];
  if (JSON.stringify(actualColumns) !== JSON.stringify(expectedColumns)) {
    return { passed: false, failure_category: "wrong_columns" };
  }

  if (actualRows.length !== expectedRows.length) {
    return { passed: false, failure_category: "wrong_output" };
  }

  for (let index = 0; index < actualRows.length; index += 1) {
    const left = actualRows[index];
    const right = expectedRows[index];
    for (const key of expectedColumns) {
      if (!valuesMatch(left[key], right[key], options.numeric_tolerance)) {
        return { passed: false, failure_category: "wrong_output" };
      }
    }
  }

  if (!orderSensitive && JSON.stringify(actual) !== JSON.stringify(expected)) {
    return { passed: true, failure_category: null };
  }

  return { passed: true, failure_category: null };
}

export async function runLocalQuery(problem: LocalProblem, sql: string): Promise<LocalRunResult> {
  const sample = problem.datasets.find((dataset) => dataset.type === "sample");
  if (!sample) {
    return { columns: [], rows: [], execution_time_ms: 0, error: "Sample dataset not configured." };
  }

  const startedAt = performance.now();
  const conn = await prepareProblemDataset(problem, sample.fixture_data);
  try {
    const table = await conn.query(sql);
    const rows = table.toArray().map((row) => row.toJSON() as Record<string, unknown>);
    const columns = rows[0] ? Object.keys(rows[0]) : [];
    return {
      columns,
      rows,
      execution_time_ms: Math.round(performance.now() - startedAt),
      error: null,
    };
  } catch (error) {
    return {
      columns: [],
      rows: [],
      execution_time_ms: 0,
      error: error instanceof Error ? error.message : "Query failed",
    };
  } finally {
    await conn.close();
  }
}

export async function submitLocalQuery(
  problem: LocalProblem,
  sql: string,
): Promise<{ result: LocalSubmitResult; submission: LocalSubmissionRecord }> {
  const datasets = problem.datasets.filter((dataset) => dataset.type !== "sample");
  const failureCategories: string[] = [];
  let visiblePassed = true;
  let hiddenPassed = true;
  let totalMs = 0;

  for (const dataset of datasets) {
    const startedAt = performance.now();
    const conn = await prepareProblemDataset(problem, dataset.fixture_data);
    try {
      const table = await conn.query(sql);
      const rows = table.toArray().map((row) => row.toJSON() as Record<string, unknown>);
      const comparison = compareRows(rows, dataset.expected ?? [], dataset.comparison_config);
      totalMs += Math.round(performance.now() - startedAt);

      if (!comparison.passed && comparison.failure_category) {
        failureCategories.push(comparison.failure_category);
      }

      if (!comparison.passed && dataset.type === "visible_testcase") visiblePassed = false;
      if (!comparison.passed && dataset.type === "hidden_testcase") hiddenPassed = false;
    } catch {
      totalMs += Math.round(performance.now() - startedAt);
      failureCategories.push("wrong_output");
      if (dataset.type === "visible_testcase") visiblePassed = false;
      if (dataset.type === "hidden_testcase") hiddenPassed = false;
    } finally {
      await conn.close();
    }
  }

  const uniqueCategories = Array.from(new Set(failureCategories));
  const status = visiblePassed && hiddenPassed ? "accepted" : "failed";
  const feedbackKey = uniqueCategories[0] ?? "wrong_output";
  const feedback = status === "accepted" ? null : FAILURE_FEEDBACK[feedbackKey] ?? FAILURE_FEEDBACK.wrong_output;
  const now = new Date().toISOString();

  const result: LocalSubmitResult = {
    submission_id: `${problem.slug}-${now}`,
    status,
    passed_visible: visiblePassed,
    passed_hidden: hiddenPassed,
    failure_categories: uniqueCategories,
    execution_time_ms: totalMs,
    hint_unlock_available: status !== "accepted",
    feedback,
    error: null,
  };

  const submission: LocalSubmissionRecord = {
    id: result.submission_id,
    problem_id: problem.id,
    slug: problem.slug,
    title: problem.title,
    status,
    execution_time_ms: totalMs,
    created_at: now,
    submitted_sql: sql,
    passed_visible: visiblePassed,
    passed_hidden: hiddenPassed,
    failure_categories: uniqueCategories,
  };

  return { result, submission };
}
