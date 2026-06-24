import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon, type MaterialSymbol } from './GarrettIcon';

export function TelemetryChip({
  icon,
  label,
  value,
  className,
}: {
  icon: MaterialSymbol;
  label?: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border border-white/5 bg-white/5 px-3 py-1',
        className,
      )}
      aria-label={label ? `${label}: ${value}` : value}
    >
      <GarrettIcon name={icon} size={14} className="text-primary" />
      {label ? <span className="sr-only">{label}</span> : null}
      <span className={cn(typography.code, 'text-on-surface')}>{value}</span>
    </div>
  );
}
