export function SkeletonCard() {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1.1fr_1.5fr_0.7fr]">
      <div className="flex flex-col justify-center gap-2.5">
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-muted" />
        <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="flex flex-col justify-center gap-2.5">
        <div className="h-5 w-[92%] animate-pulse rounded-full bg-muted" />
        <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="flex flex-col justify-center gap-2.5">
        <div className="h-5 w-4/5 animate-pulse rounded-full bg-muted" />
        <div className="h-3.5 w-3/5 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
