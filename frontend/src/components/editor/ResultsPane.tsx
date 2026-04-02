"use client";

import type { RunResult, SubmitResult } from "@/types/api";

interface ResultsPaneProps {
  runResult: RunResult | null;
  submitResult: SubmitResult | null;
  mode: "run" | "submit" | null;
}

function DataTable({ columns, rows }: { columns: string[]; rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">Query returned no rows.</p>;
  }
  return (
    <div className="overflow-auto max-h-64">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
              <th key={col} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/20">
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 whitespace-nowrap font-mono text-xs">
                  {row[col] === null ? <span className="text-muted-foreground italic">NULL</span> : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResultsPane({ runResult, submitResult, mode }: ResultsPaneProps) {
  if (!mode) {
    return (
      <div className="rounded-md border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Run or submit your query to see results.
      </div>
    );
  }

  if (mode === "run" && runResult) {
    if (runResult.error) {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive mb-1">Error</p>
          <pre className="text-xs text-destructive font-mono whitespace-pre-wrap">{runResult.error}</pre>
        </div>
      );
    }
    return (
      <div className="rounded-md border overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
          <span className="text-xs font-medium">Output ({runResult.rows.length} rows)</span>
          <span className="text-xs text-muted-foreground">{runResult.execution_time_ms}ms</span>
        </div>
        <DataTable columns={runResult.columns} rows={runResult.rows} />
      </div>
    );
  }

  if (mode === "submit" && submitResult) {
    if (submitResult.error) {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive mb-1">Error</p>
          <pre className="text-xs text-destructive font-mono whitespace-pre-wrap">{submitResult.error}</pre>
        </div>
      );
    }

    const accepted = submitResult.status === "accepted";
    return (
      <div className="space-y-3">
        {/* Overall result */}
        <div className={`rounded-md border p-4 ${accepted ? "border-green-400/50 bg-green-50" : "border-red-400/50 bg-red-50"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-bold ${accepted ? "text-green-700" : "text-red-700"}`}>
              {accepted ? "Accepted" : "Wrong Answer"}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">{submitResult.execution_time_ms}ms</span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Visible: {submitResult.passed_visible ? "✓" : "✗"}</span>
            <span>Hidden: {submitResult.passed_hidden ? "✓" : "✗"}</span>
          </div>
        </div>

        {/* Feedback */}
        {submitResult.feedback && (
          <div className="rounded-md border bg-card p-4">
            <p className="text-sm font-medium mb-1">Feedback</p>
            <p className="text-sm text-muted-foreground mb-2">{submitResult.feedback.summary}</p>
            <p className="text-sm text-primary">{submitResult.feedback.next_step}</p>
          </div>
        )}

        {/* Failure categories */}
        {submitResult.failure_categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {submitResult.failure_categories.map((cat) => (
              <span key={cat} className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs">
                {cat.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
