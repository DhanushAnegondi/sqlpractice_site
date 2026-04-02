"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg text-primary">
            SQLPractice
          </Link>
          <Link href="/problems" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Problems
          </Link>
          <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Profile
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Local-first preview</span>
        </div>
      </div>
    </nav>
  );
}
