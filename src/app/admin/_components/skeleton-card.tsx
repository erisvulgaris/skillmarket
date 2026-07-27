export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-pulse">
      <div className="h-3 w-20 bg-muted rounded" />
      <div className="h-7 w-28 bg-muted rounded" />
      <div className="h-3 w-16 bg-muted rounded" />
    </div>
  )
}
