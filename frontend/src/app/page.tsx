import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-4">SQL Practice Platform</h1>
      <p className="text-lg text-muted-foreground max-w-2xl mb-8">
        Master interview SQL, business analytics SQL, and production-style data engineering SQL
        through realistic problems, hidden testcase rigor, and deep learning feedback.
      </p>
      <div className="flex gap-4">
        <Link
          href="/problems"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Browse Problems
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
        >
          Get Started
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {[
          { title: "Interview Mode", desc: "LeetCode-style SQL with hidden testcase rigor", color: "text-blue-600" },
          { title: "Analytics Mode", desc: "Business-context SQL like StrataScratch", color: "text-purple-600" },
          { title: "Data Engineering Mode", desc: "Production-style CDC, SCD, and pipeline SQL", color: "text-green-600" },
        ].map((m) => (
          <div key={m.title} className="rounded-lg border bg-card p-6 text-left">
            <h3 className={`font-semibold text-lg mb-2 ${m.color}`}>{m.title}</h3>
            <p className="text-sm text-muted-foreground">{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
