import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0 space-y-1">
        {eyebrow ? <p className={typography.eyebrowPrimary}>{eyebrow}</p> : null}
        <h2 className={typography.headline}>{title}</h2>
        {description ? <p className={typography.body}>{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionHeaderCompact({ title, meta }: { title: string; meta?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/8 pb-2">
      <h3 className={cn(typography.labelCaps, 'text-on-surface-variant')}>{title}</h3>
      {meta}
    </div>
  );
}
