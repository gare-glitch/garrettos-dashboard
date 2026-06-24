import { cn } from '@/lib/utils';

export function BentoGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4', className)}>{children}</div>
  );
}

export function DashboardGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4', className)}>{children}</div>
  );
}

export function Span({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('md:col-span-12', className)}>{children}</div>;
}
