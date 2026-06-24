'use client';

import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon } from './GarrettIcon';

export function CommandInput({
  placeholder = 'Run command or search nodes…',
  onFocus,
  onClick,
  className,
  showShortcut = true,
}: {
  placeholder?: string;
  onFocus?: () => void;
  onClick?: () => void;
  className?: string;
  showShortcut?: boolean;
}) {
  return (
    <div className={cn('relative group', className)}>
      <GarrettIcon
        name="search"
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
      />
      <input
        type="text"
        readOnly
        onFocus={onFocus}
        onClick={onClick}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border border-white/10 bg-surface-container-lowest/50 py-2 pl-10 pr-14',
          typography.code,
          'text-on-surface placeholder:text-outline/50',
          'transition-all focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30',
          'cursor-pointer',
        )}
        aria-label="Command palette"
      />
      {showShortcut ? (
        <kbd
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/10',
            'bg-surface-container-high/40 px-1.5 py-0.5 font-mono text-[10px] text-outline/70',
          )}
        >
          ⌘K
        </kbd>
      ) : null}
    </div>
  );
}
