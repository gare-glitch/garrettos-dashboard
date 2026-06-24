import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const chipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
  {
    variants: {
      tone: {
        good: 'border-green/30 bg-green/10 text-green',
        warn: 'border-amber/30 bg-amber/10 text-amber',
        info: 'border-cyan/30 bg-cyan/10 text-cyan',
        bad: 'border-red/30 bg-red/10 text-red',
        idle: 'border-border bg-muted/40 text-muted-foreground',
      },
    },
    defaultVariants: { tone: 'idle' },
  },
);

export function StatusChip({
  label,
  tone,
  className,
}: { label: string } & VariantProps<typeof chipVariants> & { className?: string }) {
  return <span className={cn(chipVariants({ tone }), className)}>{label}</span>;
}
