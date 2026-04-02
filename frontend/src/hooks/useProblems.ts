import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useProblems(filters: Record<string, string>) {
  return useQuery({
    queryKey: ["problems", filters],
    queryFn: () => api.problems.list(filters),
  });
}

export function useProblem(slug: string) {
  return useQuery({
    queryKey: ["problem", slug],
    queryFn: () => api.problems.get(slug),
    enabled: !!slug,
  });
}

export function useRun(slug: string) {
  return useMutation({
    mutationFn: (sql: string) => api.execution.run(slug, sql),
  });
}

export function useSubmit(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sql: string) => api.execution.submit(slug, sql),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}

export function useProgress(enabled = true) {
  return useQuery({
    queryKey: ["progress"],
    queryFn: () => api.users.progress(),
    enabled,
  });
}

export function useSubmissions(enabled = true) {
  return useQuery({
    queryKey: ["submissions"],
    queryFn: () => api.users.submissions(),
    enabled,
  });
}
