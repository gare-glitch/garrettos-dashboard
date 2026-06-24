import { cn } from '@/lib/utils';

export function DataRow({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="min-w-0 space-y-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </div>
      <div className={cn('shrink-0 text-right text-sm font-semibold capitalize', valueClassName)}>{value}</div>
    </div>
  );
}
