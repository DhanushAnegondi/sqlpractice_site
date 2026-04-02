import type { LocalProblem, LocalProblemSummary } from "./types";

const LOCAL_PROBLEMS: LocalProblem[] = [
  {
    id: "duplicate-emails",
    slug: "duplicate-emails",
    title: "Duplicate Emails",
    description:
      "## Problem\n\nGiven a `person` table, write a SQL query to find all emails that appear more than once.\n\n### Schema\n\n```\nperson(id INTEGER, email VARCHAR)\n```\n\n### Expected Output\n\nReturn a single column `email` containing each duplicate email once.",
    mode: "interview",
    difficulty: "easy",
    dialect: "duckdb",
    estimated_time_minutes: 10,
    tags: [
      { name: "aggregation", category: "topic" },
      { name: "group-by", category: "topic" },
    ],
    schema_tables: [
      {
        table_name: "person",
        columns: [
          { name: "id", type: "INTEGER", nullable: false },
          { name: "email", type: "VARCHAR", nullable: true },
        ],
      },
    ],
    sample_data: {
      person: [
        { id: 1, email: "alice@example.com" },
        { id: 2, email: "bob@example.com" },
        { id: 3, email: "alice@example.com" },
      ],
    },
    starter_sql: "SELECT email\nFROM person\nGROUP BY email\nHAVING COUNT(*) > 1;",
    datasets: [
      {
        name: "sample",
        type: "sample",
        fixture_data: {
          person: [
            { id: 1, email: "alice@example.com" },
            { id: 2, email: "bob@example.com" },
            { id: 3, email: "alice@example.com" },
          ],
        },
      },
      {
        name: "visible_testcase_1",
        type: "visible_testcase",
        fixture_data: {
          person: [
            { id: 1, email: "alice@example.com" },
            { id: 2, email: "bob@example.com" },
            { id: 3, email: "alice@example.com" },
          ],
        },
        expected: [{ email: "alice@example.com" }],
        comparison_config: { order_sensitive: false, duplicate_sensitive: true },
      },
      {
        name: "hidden_testcase_nulls",
        type: "hidden_testcase",
        fixture_data: {
          person: [
            { id: 1, email: null },
            { id: 2, email: null },
            { id: 3, email: "x@y.com" },
          ],
        },
        expected: [{ email: null }],
        comparison_config: { order_sensitive: false, duplicate_sensitive: true },
      },
    ],
  },
  {
    id: "top-customer-by-spend",
    slug: "top-customer-by-spend",
    title: "Top Customer by Spend",
    description:
      "## Problem\n\nGiven an `orders` table, find the customer with the highest total spend.\n\nReturn `customer_id` and `total_spend`. If there is a tie, return all tied customers.\n\n### Schema\n\n```\norders(order_id INTEGER, customer_id INTEGER, amount DECIMAL)\n```",
    mode: "interview",
    difficulty: "medium",
    dialect: "duckdb",
    estimated_time_minutes: 15,
    tags: [
      { name: "aggregation", category: "topic" },
      { name: "ranking", category: "topic" },
      { name: "window-functions", category: "topic" },
    ],
    schema_tables: [
      {
        table_name: "orders",
        columns: [
          { name: "order_id", type: "INTEGER", nullable: false },
          { name: "customer_id", type: "INTEGER", nullable: false },
          { name: "amount", type: "DOUBLE", nullable: true },
        ],
      },
    ],
    sample_data: {
      orders: [
        { order_id: 1, customer_id: 1, amount: 100 },
        { order_id: 2, customer_id: 2, amount: 200 },
        { order_id: 3, customer_id: 1, amount: 150 },
        { order_id: 4, customer_id: 3, amount: 50 },
      ],
    },
    starter_sql:
      "WITH spend AS (\n  SELECT customer_id, SUM(amount) AS total_spend\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT customer_id, total_spend\nFROM spend\nWHERE total_spend = (SELECT MAX(total_spend) FROM spend);",
    datasets: [
      {
        name: "sample",
        type: "sample",
        fixture_data: {
          orders: [
            { order_id: 1, customer_id: 1, amount: 100 },
            { order_id: 2, customer_id: 2, amount: 200 },
            { order_id: 3, customer_id: 1, amount: 150 },
            { order_id: 4, customer_id: 3, amount: 50 },
          ],
        },
      },
      {
        name: "visible_testcase_1",
        type: "visible_testcase",
        fixture_data: {
          orders: [
            { order_id: 1, customer_id: 1, amount: 100 },
            { order_id: 2, customer_id: 2, amount: 200 },
            { order_id: 3, customer_id: 1, amount: 150 },
            { order_id: 4, customer_id: 3, amount: 50 },
          ],
        },
        expected: [{ customer_id: 1, total_spend: 250 }],
        comparison_config: { order_sensitive: false, numeric_tolerance: 0.01 },
      },
      {
        name: "hidden_testcase_tie",
        type: "hidden_testcase",
        fixture_data: {
          orders: [
            { order_id: 1, customer_id: 1, amount: 300 },
            { order_id: 2, customer_id: 2, amount: 300 },
            { order_id: 3, customer_id: 3, amount: 100 },
          ],
        },
        expected: [
          { customer_id: 1, total_spend: 300 },
          { customer_id: 2, total_spend: 300 },
        ],
        comparison_config: { order_sensitive: false, numeric_tolerance: 0.01 },
      },
    ],
  },
  {
    id: "deduplicate-cdc-records",
    slug: "deduplicate-cdc-records",
    title: "Deduplicate CDC Records",
    description:
      "## Problem\n\nYou receive a CDC stream in a `cdc_events` table. Write a query to return the latest record per business key based on `event_timestamp`.\n\n### Schema\n\n```\ncdc_events(event_id INTEGER, business_key VARCHAR, payload VARCHAR, event_timestamp TIMESTAMP)\n```",
    mode: "data_engineering",
    difficulty: "medium",
    dialect: "duckdb",
    estimated_time_minutes: 20,
    tags: [
      { name: "deduplication", category: "topic" },
      { name: "window-functions", category: "topic" },
      { name: "cdc", category: "topic" },
    ],
    schema_tables: [
      {
        table_name: "cdc_events",
        columns: [
          { name: "event_id", type: "INTEGER", nullable: false },
          { name: "business_key", type: "VARCHAR", nullable: false },
          { name: "payload", type: "VARCHAR", nullable: true },
          { name: "event_timestamp", type: "TIMESTAMP", nullable: false },
        ],
      },
    ],
    sample_data: {
      cdc_events: [
        { event_id: 1, business_key: "K1", payload: "v1", event_timestamp: "2024-01-01 10:00:00" },
        { event_id: 2, business_key: "K1", payload: "v2", event_timestamp: "2024-01-01 11:00:00" },
        { event_id: 3, business_key: "K2", payload: "v3", event_timestamp: "2024-01-01 09:00:00" },
      ],
    },
    starter_sql:
      "SELECT business_key, payload, event_timestamp\nFROM (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY business_key ORDER BY event_timestamp DESC) AS rn\n  FROM cdc_events\n)\nWHERE rn = 1;",
    datasets: [
      {
        name: "sample",
        type: "sample",
        fixture_data: {
          cdc_events: [
            { event_id: 1, business_key: "K1", payload: "v1", event_timestamp: "2024-01-01 10:00:00" },
            { event_id: 2, business_key: "K1", payload: "v2", event_timestamp: "2024-01-01 11:00:00" },
            { event_id: 3, business_key: "K2", payload: "v3", event_timestamp: "2024-01-01 09:00:00" },
          ],
        },
      },
      {
        name: "visible_testcase_1",
        type: "visible_testcase",
        fixture_data: {
          cdc_events: [
            { event_id: 1, business_key: "K1", payload: "v1", event_timestamp: "2024-01-01 10:00:00" },
            { event_id: 2, business_key: "K1", payload: "v2", event_timestamp: "2024-01-01 11:00:00" },
            { event_id: 3, business_key: "K2", payload: "v3", event_timestamp: "2024-01-01 09:00:00" },
          ],
        },
        expected: [
          { business_key: "K1", payload: "v2", event_timestamp: "2024-01-01 11:00:00" },
          { business_key: "K2", payload: "v3", event_timestamp: "2024-01-01 09:00:00" },
        ],
        comparison_config: { order_sensitive: false },
      },
    ],
  },
];

export function listLocalProblems(): LocalProblemSummary[] {
  return LOCAL_PROBLEMS.map(({ datasets, starter_sql, ...problem }) => problem);
}

export function getLocalProblem(slug: string): LocalProblem | null {
  return LOCAL_PROBLEMS.find((problem) => problem.slug === slug) ?? null;
}

export function getAllLocalProblems(): LocalProblem[] {
  return LOCAL_PROBLEMS;
}
