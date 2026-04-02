export interface TagOut {
  name: string;
  category: string | null;
}

export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
}

export interface SchemaTableOut {
  table_name: string;
  columns: ColumnDef[];
}

export interface ProblemListItem {
  id: string;
  slug: string;
  title: string;
  mode: string;
  difficulty: string;
  estimated_time_minutes: number | null;
  tags: TagOut[];
}

export interface ProblemListResponse {
  items: ProblemListItem[];
  total: number;
}

export interface ProblemDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  mode: string;
  difficulty: string;
  dialect: string;
  estimated_time_minutes: number | null;
  tags: TagOut[];
  schema_tables: SchemaTableOut[];
  sample_data: Record<string, Record<string, unknown>[]>;
}

export interface RunResult {
  columns: string[];
  rows: Record<string, unknown>[];
  execution_time_ms: number;
  error: string | null;
}

export interface FeedbackDetail {
  summary: string;
  next_step: string;
}

export interface SubmitResult {
  submission_id: string;
  status: string;
  passed_visible: boolean;
  passed_hidden: boolean;
  failure_categories: string[];
  execution_time_ms: number;
  hint_unlock_available: boolean;
  feedback: FeedbackDetail | null;
  error: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserOut {
  id: string;
  email: string;
  name: string;
  subscription_tier: string;
}

export interface ProgressOut {
  problem_id: string;
  slug: string;
  title: string;
  best_status: string | null;
  total_attempts: number;
  solved_at: string | null;
  last_attempt_at: string | null;
}

export interface SubmissionOut {
  id: string;
  problem_id: string;
  status: string;
  execution_time_ms: number | null;
  created_at: string;
}
