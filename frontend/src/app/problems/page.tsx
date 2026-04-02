import { Suspense } from "react";
import { ProblemsPageClient } from "./problems-page-client";

function ProblemsPageFallback() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="h-8 w-36 rounded bg-muted animate-pulse" />
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="h-24 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense fallback={<ProblemsPageFallback />}>
      <ProblemsPageClient />
    </Suspense>
  );
}
