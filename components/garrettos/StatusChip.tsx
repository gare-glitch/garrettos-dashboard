import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { statusBorders } from '@/lib/design-system';
import { BreathingPip } from './BreathingPip';

const chipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 label-caps',
  {
    variants: {
      tone: {
        good: cn(statusBorders.good, 'text-secondary'),
        warn: cn(statusBorders.warn, 'text-primary'),
        info: cn(statusBorders.info, 'text-tertiary'),
        bad: cn(statusBorders.bad, 'text-error'),
        idle: cn(statusBorders.idle, 'text-on-surface-variant'),
      },
      size: {
        default: 'text-[10px]',
        inline: 'text-[9px] px-1.5 py-0',
      },
    },
    defaultVariants: { tone: 'idle', size: 'default' },
  },
);

const pipToneMap = {
  good: 'good',
  warn: 'warn',
  info: 'info',
  bad: 'error',
  idle: 'idle',
} as const;

export function StatusChip({
  label,
  tone,
  size,
  pulse = false,
  showPip = false,
  className,
}: { label: string; pulse?: boolean; showPip?: boolean; className?: string } & VariantProps<
  typeof chipVariants
>) {
  return (
    <span className={cn(chipVariants({ tone, size }), className)} role="status">
      {showPip ? (
        <BreathingPip tone={pipToneMap[tone ?? 'idle']} pulse={pulse || tone === 'good' || tone === 'bad'} />
      ) : null}
      {label}
    </span>
  );
}
