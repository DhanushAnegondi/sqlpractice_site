"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useProgress, useSubmissions } from "@/hooks/useProblems";

const STATUS_STYLES: Record<string, string> = {
  accepted: "bg-emerald-100 text-emerald-800",
  failed: "bg-amber-100 text-amber-900",
  error: "bg-rose-100 text-rose-800",
};

function formatDate(value: string | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const isAuthed = Boolean(user);
  const progressQuery = useProgress(isAuthed);
  const submissionsQuery = useSubmissions(isAuthed);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-64 rounded bg-muted" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-32 rounded-lg bg-muted" />
            <div className="h-32 rounded-lg bg-muted" />
            <div className="h-32 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const progress = progressQuery.data ?? [];
  const submissions = submissionsQuery.data ?? [];
  const solvedCount = progress.filter((item) => item.best_status === "accepted").length;
  const attemptedCount = progress.length;
  const recentSolved = [...progress]
    .filter((item) => item.solved_at)
    .sort((a, b) => new Date(b.solved_at ?? 0).getTime() - new Date(a.solved_at ?? 0).getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Profile</p>
          <h1 className="text-3xl font-semibold">{user.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Link
          href="/problems"
          className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Browse problems
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Problems solved</p>
          <p className="mt-3 text-4xl font-semibold">{solvedCount}</p>
          <p className="mt-2 text-sm text-muted-foreground">{attemptedCount} attempted overall</p>
        </section>
        <section className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Recent submissions</p>
          <p className="mt-3 text-4xl font-semibold">{submissions.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">Latest 20 attempts from your account</p>
        </section>
        <section className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Plan</p>
          <p className="mt-3 text-lg font-medium capitalize">{user.subscription_tier}</p>
          <p className="mt-2 text-sm text-muted-foreground">Upgrade later when premium drills exist.</p>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Progress by problem</h2>
              <p className="text-sm text-muted-foreground">Your latest status across attempted problems.</p>
            </div>
          </div>

          {progressQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : progressQuery.isError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Could not load progress.
            </p>
          ) : progress.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
              No attempts yet. Start with the seeded problems to populate your dashboard.
            </div>
          ) : (
            <div className="space-y-3">
              {progress.map((item) => (
                <Link
                  key={item.problem_id}
                  href={`/problems/${item.slug}`}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.total_attempts} attempts • last activity {formatDate(item.last_attempt_at)}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[item.best_status ?? "error"] ?? STATUS_STYLES.error}`}>
                    {item.best_status ?? "not started"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Recently solved</h2>
          <p className="mb-4 text-sm text-muted-foreground">Most recent accepted problems.</p>

          {recentSolved.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Accepted submissions will show up here.
            </div>
          ) : (
            <div className="space-y-3">
              {recentSolved.map((item) => (
                <div key={item.problem_id} className="rounded-lg bg-muted/40 p-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Solved {formatDate(item.solved_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
