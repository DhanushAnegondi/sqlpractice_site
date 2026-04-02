import type {
  ProblemDetail,
  ProblemListItem,
  RunResult,
  SubmitResult,
  SubmissionOut,
  ProgressOut,
} from "@/types/api";

export interface LocalDataset {
  name: string;
  type: "sample" | "visible_testcase" | "hidden_testcase";
  fixture_data: Record<string, Record<string, unknown>[]>;
  expected?: Record<string, unknown>[];
  comparison_config?: {
    order_sensitive?: boolean;
    duplicate_sensitive?: boolean;
    numeric_tolerance?: number;
  };
}

export interface LocalProblem extends ProblemDetail {
  starter_sql: string;
  datasets: LocalDataset[];
}

export interface LocalProblemSummary extends ProblemListItem {}

export interface DraftRecord {
  slug: string;
  sql: string;
  updated_at: string;
}

export interface LocalSubmissionRecord extends SubmissionOut {
  slug: string;
  title: string;
  submitted_sql: string;
  passed_visible: boolean;
  passed_hidden: boolean;
  failure_categories: string[];
}

export interface LocalProgressRecord extends ProgressOut {}

export interface LocalRunResult extends RunResult {}
export interface LocalSubmitResult extends SubmitResult {}
