import { cn } from '@/lib/utils';

const toneClasses = {
  good: 'bg-secondary',
  warn: 'bg-primary',
  info: 'bg-tertiary',
  bad: 'bg-error',
  idle: 'bg-outline',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  error: 'bg-error',
} as const;

export function BreathingPip({
  tone = 'primary',
  className,
  pulse = true,
}: {
  tone?: keyof typeof toneClasses;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        toneClasses[tone],
        pulse && 'breathing-pip',
        className,
      )}
      aria-hidden
    />
  );
}
