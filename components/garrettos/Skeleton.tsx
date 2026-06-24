import { cn } from '@/lib/utils';

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-white/5 via-white/10 to-white/5',
        className,
      )}
      aria-hidden
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <Shimmer className={cn('h-4 w-full', className)} />;
}

export function MetricSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="glass-card space-y-3 rounded-xl p-4 md:p-5" aria-busy aria-label="Loading metric">
      <Shimmer className="h-3 w-20" />
      <Shimmer className={cn(compact ? 'h-8 w-24' : 'h-10 w-32')} />
      <Shimmer className="h-1 w-full rounded-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-panel space-y-2 rounded-xl p-4" aria-busy aria-label="Loading table">
      <Shimmer className="mb-4 h-4 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Shimmer key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card space-y-3 rounded-xl p-5" aria-busy>
      <Shimmer className="h-3 w-24" />
      <Shimmer className="h-8 w-16" />
      <Shimmer className="h-16 w-full" />
    </div>
  );
}
