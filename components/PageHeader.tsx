import { cn } from '@/lib/utils';

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn('space-y-2', className)}>
      {eyebrow ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan">{eyebrow}</p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      {description ? <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p> : null}
    </header>
  );
}
