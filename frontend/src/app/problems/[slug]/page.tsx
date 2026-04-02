"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProblem, useRun, useSubmit } from "@/hooks/useProblems";
import { SqlEditor } from "@/components/editor/SqlEditor";
import { ResultsPane } from "@/components/editor/ResultsPane";
import { SchemaViewer } from "@/components/problems/SchemaViewer";
import type { RunResult, SubmitResult } from "@/types/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
};

const MODE_LABELS: Record<string, string> = {
  interview: "Interview",
  analytics: "Analytics",
  data_engineering: "Data Engineering",
};

function DescriptionPanel({ description }: { description: string }) {
  // Basic markdown-like rendering for the description
  return (
    <div className="prose prose-sm max-w-none text-sm">
      {description.split("\n").map((line, i) => {
        if (line.startsWith("## ")) return <h2 key={i} className="text-base font-semibold mt-4 mb-2">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith("```")) return null;
        if (line.trim() === "") return <br key={i} />;
        return <p key={i} className="mb-1 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

export default function ProblemPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();

  const { data: problem, isLoading, error } = useProblem(slug);
  const runMutation = useRun(slug);
  const submitMutation = useSubmit(slug);

  const [sql, setSql] = useState("-- Write your SQL query here\n\n");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [resultMode, setResultMode] = useState<"run" | "submit" | null>(null);
  const [activeTab, setActiveTab] = useState<"problem" | "schema">("problem");

  async function handleRun() {
    setResultMode("run");
    setRunResult(null);
    const result = await runMutation.mutateAsync(sql);
    setRunResult(result);
  }

  async function handleSubmit() {
    setResultMode("submit");
    setSubmitResult(null);
    const result = await submitMutation.mutateAsync(sql);
    setSubmitResult(result);
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-destructive">Problem not found.</p>
        <Link href="/problems" className="text-sm text-primary hover:underline mt-2 block">← Back to problems</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-4">
        <Link href="/problems" className="text-xs text-muted-foreground hover:text-foreground mb-2 block">
          ← Problems
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold">{problem.title}</h1>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {MODE_LABELS[problem.mode] ?? problem.mode}
          </span>
          {problem.estimated_time_minutes && (
            <span className="text-xs text-muted-foreground">{problem.estimated_time_minutes} min</span>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          {problem.tags.map((t) => (
            <span key={t.name} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {t.name}
            </span>
          ))}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel: problem + schema */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("problem")}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${activeTab === "problem" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              Problem
            </button>
            <button
              onClick={() => setActiveTab("schema")}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${activeTab === "schema" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              Schema & Data
            </button>
          </div>

          {activeTab === "problem" && (
            <div className="rounded-lg border bg-card p-5 min-h-[400px]">
              <DescriptionPanel description={problem.description} />
            </div>
          )}

          {activeTab === "schema" && (
            <div className="rounded-lg border bg-card p-5 min-h-[400px]">
              <SchemaViewer tables={problem.schema_tables} sampleData={problem.sample_data} />
            </div>
          )}
        </div>

        {/* Right panel: editor + results */}
        <div className="space-y-4">
          <SqlEditor value={sql} onChange={setSql} height="300px" />

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <p className="text-sm text-muted-foreground">Checking session...</p>
            ) : !user ? (
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">Sign in</Link> to run and submit queries.
              </p>
            ) : (
              <>
                <button
                  onClick={handleRun}
                  disabled={runMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  {runMutation.isPending ? "Running..." : "Run"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit"}
                </button>
              </>
            )}
          </div>

          {/* Results */}
          <ResultsPane runResult={runResult} submitResult={submitResult} mode={resultMode} />
        </div>
      </div>
    </div>
  );
}
