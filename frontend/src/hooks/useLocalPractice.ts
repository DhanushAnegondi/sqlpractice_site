"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocalProblem, listLocalProblems } from "@/lib/local/problems";
import { getDraft, listProgress, listSubmissions } from "@/lib/local/storage";

export function useLocalProblems() {
  return useQuery({
    queryKey: ["local-problems"],
    queryFn: async () => listLocalProblems(),
    staleTime: Infinity,
  });
}

export function useLocalProblem(slug: string) {
  return useQuery({
    queryKey: ["local-problem", slug],
    queryFn: async () => getLocalProblem(slug),
    enabled: Boolean(slug),
    staleTime: Infinity,
  });
}

export function useLocalDraft(slug: string) {
  return useQuery({
    queryKey: ["local-draft", slug],
    queryFn: () => getDraft(slug),
    enabled: Boolean(slug),
  });
}

export function useLocalProgress() {
  return useQuery({
    queryKey: ["local-progress"],
    queryFn: () => listProgress(),
  });
}

export function useLocalSubmissions() {
  return useQuery({
    queryKey: ["local-submissions"],
    queryFn: () => listSubmissions(),
  });
}
