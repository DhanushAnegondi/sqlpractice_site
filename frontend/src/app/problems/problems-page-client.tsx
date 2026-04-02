"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProblems } from "@/hooks/useProblems";
import type { ProblemListItem } from "@/types/api";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
};

const MODE_COLORS: Record<string, string> = {
  interview: "bg-blue-100 text-blue-800",
  analytics: "bg-purple-100 text-purple-800",
  data_engineering: "bg-emerald-100 text-emerald-800",
};

const MODE_LABELS: Record<string, string> = {
  interview: "Interview",
  analytics: "Analytics",
  data_engineering: "Data Engineering",
};

function ProblemCard({ problem }: { problem: ProblemListItem }) {
  return (
    <Link href={`/problems/${problem.slug}`} className="block">
      <div className="rounded-lg border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-medium text-base">{problem.title}</h3>
          <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[problem.difficulty] ?? "bg-gray-100 text-gray-800"}`}>
            {problem.difficulty}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${MODE_COLORS[problem.mode] ?? "bg-gray-100 text-gray-800"}`}>
            {MODE_LABELS[problem.mode] ?? problem.mode}
          </span>
          {problem.tags.slice(0, 3).map((t) => (
            <span key={t.name} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {t.name}
            </span>
          ))}
          {problem.estimated_time_minutes && (
            <span className="ml-auto text-xs text-muted-foreground">{problem.estimated_time_minutes} min</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProblemsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters: Record<string, string> = {};
  if (searchParams.get("difficulty")) filters.difficulty = searchParams.get("difficulty")!;
  if (searchParams.get("mode")) filters.mode = searchParams.get("mode")!;
  if (searchParams.get("search")) filters.search = searchParams.get("search")!;

  const { data, isLoading, error } = useProblems(filters);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/problems?${params.toString()}`);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Problems</h1>
        <p className="text-muted-foreground text-sm">
          {data?.total ?? 0} problems available
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search problems..."
          defaultValue={searchParams.get("search") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") setFilter("search", (e.target as HTMLInputElement).value);
          }}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-56"
        />

        <select
          value={searchParams.get("difficulty") ?? ""}
          onChange={(e) => setFilter("difficulty", e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          value={searchParams.get("mode") ?? ""}
          onChange={(e) => setFilter("mode", e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All modes</option>
          <option value="interview">Interview</option>
          <option value="analytics">Analytics</option>
          <option value="data_engineering">Data Engineering</option>
        </select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load problems. Make sure the backend is running.
        </div>
      )}

      {data && (
        <div className="space-y-3">
          {data.items.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
          {data.items.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No problems match your filters.</p>
          )}
        </div>
      )}
    </div>
  );
}
