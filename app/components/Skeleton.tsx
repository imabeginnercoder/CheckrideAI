type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

export function AppShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-slate-100" role="status" aria-label="Loading CheckrideAI">
      <aside className="hidden w-60 shrink-0 bg-slate-950 p-5 md:block">
        <Skeleton className="h-9 w-36 bg-white/10" />
        <div className="mt-10 space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full bg-white/10" />
          ))}
        </div>
      </aside>
      <main className="mx-auto w-full max-w-5xl p-6 md:p-8">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-y border-slate-200 py-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-4 h-9 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-200" role="status" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-1 py-4">
          <Skeleton className="h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
