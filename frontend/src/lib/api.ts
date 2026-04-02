import type {
  ProblemListResponse,
  ProblemDetail,
  RunResult,
  SubmitResult,
  TokenResponse,
  UserOut,
  ProgressOut,
  SubmissionOut,
} from "@/types/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      message = JSON.parse(text)?.detail ?? text;
    } catch {}
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    register: (email: string, name: string, password: string) =>
      apiFetch<TokenResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, name, password }),
      }),
    login: (email: string, password: string) =>
      apiFetch<TokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => apiFetch<UserOut>("/auth/me"),
  },

  problems: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return apiFetch<ProblemListResponse>(`/problems${qs}`);
    },
    get: (slug: string) => apiFetch<ProblemDetail>(`/problems/${slug}`),
  },

  execution: {
    run: (slug: string, sql: string) =>
      apiFetch<RunResult>(`/problems/${slug}/run`, {
        method: "POST",
        body: JSON.stringify({ sql }),
      }),
    submit: (slug: string, sql: string) =>
      apiFetch<SubmitResult>(`/problems/${slug}/submit`, {
        method: "POST",
        body: JSON.stringify({ sql }),
      }),
  },

  users: {
    progress: () => apiFetch<ProgressOut[]>("/users/me/progress"),
    submissions: () => apiFetch<SubmissionOut[]>("/users/me/submissions"),
  },
};
