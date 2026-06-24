import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LauncherCard({
  href,
  title,
  metric,
  note,
  className,
}: {
  href: string;
  title: string;
  metric: string;
  note: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'glass-panel group relative flex min-h-32 flex-col justify-between overflow-hidden rounded-3xl p-4 transition-transform hover:-translate-y-0.5 hover:brightness-110 md:min-h-36 md:p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan" />
      </div>
      <div>
        <strong className="block text-3xl font-black tracking-tight md:text-4xl">{metric}</strong>
        <small className="mt-1 block text-xs text-muted-foreground">{note}</small>
      </div>
    </Link>
  );
}
