"use client";

import { openDB } from "idb";
import type { DraftRecord, LocalProgressRecord, LocalSubmissionRecord } from "./types";
import { getLocalProblem } from "./problems";

const DB_NAME = "sqlpractice-local";
const DB_VERSION = 1;

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("drafts")) {
        db.createObjectStore("drafts", { keyPath: "slug" });
      }
      if (!db.objectStoreNames.contains("progress")) {
        db.createObjectStore("progress", { keyPath: "problem_id" });
      }
      if (!db.objectStoreNames.contains("submissions")) {
        db.createObjectStore("submissions", { keyPath: "id" });
      }
    },
  });
}

export async function getDraft(slug: string) {
  const db = await getDb();
  const draft = await db.get("drafts", slug);
  return (draft as DraftRecord | undefined) ?? null;
}

export async function saveDraft(slug: string, sql: string) {
  const db = await getDb();
  const value: DraftRecord = { slug, sql, updated_at: new Date().toISOString() };
  await db.put("drafts", value);
  return value;
}

export async function listProgress(): Promise<LocalProgressRecord[]> {
  const db = await getDb();
  const items = ((await db.getAll("progress")) as LocalProgressRecord[]) ?? [];
  return items.sort((a, b) => (b.last_attempt_at ?? "").localeCompare(a.last_attempt_at ?? ""));
}

export async function listSubmissions(): Promise<LocalSubmissionRecord[]> {
  const db = await getDb();
  const items = ((await db.getAll("submissions")) as LocalSubmissionRecord[]) ?? [];
  return items.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 20);
}

export async function recordLocalSubmission(entry: LocalSubmissionRecord) {
  const db = await getDb();
  await db.put("submissions", entry);

  const existing = (await db.get("progress", entry.problem_id)) as LocalProgressRecord | undefined;
  const problem = getLocalProblem(entry.slug);
  const now = entry.created_at;

  const next: LocalProgressRecord = {
    problem_id: entry.problem_id,
    slug: entry.slug,
    title: problem?.title ?? entry.title,
    best_status:
      existing?.best_status === "accepted" || entry.status === "accepted"
        ? "accepted"
        : entry.status,
    total_attempts: (existing?.total_attempts ?? 0) + 1,
    solved_at:
      existing?.solved_at ?? (entry.status === "accepted" ? now : null),
    last_attempt_at: now,
  };

  await db.put("progress", next);
}
