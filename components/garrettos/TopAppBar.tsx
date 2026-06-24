'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { osShellTelemetry } from '@/data/os-mock';
import { BreathingPip } from './BreathingPip';
import { CommandInput } from './CommandInput';
import { GarrettIcon } from './GarrettIcon';
import { StatusChip } from './StatusChip';
import { TelemetryChip } from './TelemetryChip';

export function TopAppBar({
  onCommandOpen,
  onMenuOpen,
  className,
}: {
  onCommandOpen: () => void;
  onMenuOpen?: () => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const t = osShellTelemetry;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 flex h-topbar items-center gap-3 border-b border-white/8',
        'bg-surface/80 px-margin-mobile backdrop-blur-xl md:gap-4 md:px-margin-desktop',
        className,
      )}
      role="banner"
    >
      {/* Left: wordmark + mobile menu */}
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        {onMenuOpen ? (
          <button
            type="button"
            onClick={onMenuOpen}
            className="flex size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-white/5 hover:text-primary md:hidden"
            aria-label="Open navigation"
          >
            <GarrettIcon name="menu" size={22} />
          </button>
        ) : null}
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="GarrettOS home">
          <motion.span
            className="text-headline-md font-bold tracking-tighter text-primary"
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            GarrettOS
          </motion.span>
        </Link>
      </div>

      {/* Center: command input — hidden on smallest screens */}
      <div className="hidden min-w-0 flex-1 sm:block md:max-w-xl lg:max-w-2xl">
        <CommandInput onClick={onCommandOpen} onFocus={onCommandOpen} />
      </div>

      {/* Telemetry — desktop only */}
      <div className="hidden items-center gap-2 xl:flex" aria-label="System telemetry">
        <TelemetryChip icon="memory" value={`CPU: ${t.cpu}`} />
        <TelemetryChip icon="sensors" value={`MEM: ${t.mem}`} />
        <TelemetryChip icon="signal_cellular_alt" value={`LAT: ${t.lat}`} />
        <TelemetryChip icon="hub" value={`API: ${t.api}`} />
      </div>

      {/* Agent + model status */}
      <div className="hidden items-center gap-2 md:flex">
        <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-2.5 py-1">
          <BreathingPip tone="secondary" />
          <span className={cn(typography.labelCaps, 'normal-case tracking-normal text-[10px] text-secondary')}>
            {t.agentStatus}
          </span>
        </div>
        <StatusChip label={t.activeModel} tone="info" size="inline" />
      </div>

      {/* Actions */}
      <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
        <button
          type="button"
          onClick={onCommandOpen}
          className="flex size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-white/5 hover:text-primary sm:hidden"
          aria-label="Open command palette"
        >
          <GarrettIcon name="search" size={20} />
        </button>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-white/5 hover:text-primary"
          aria-label="Notifications"
        >
          <GarrettIcon name="notifications" size={20} />
        </button>
        <Link
          href="/settings"
          className="hidden size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-white/5 hover:text-primary sm:flex"
          aria-label="Settings"
        >
          <GarrettIcon name="settings" size={20} />
        </Link>
        <div
          className="flex size-8 items-center justify-center rounded-full border border-primary/30 bg-primary-container/20"
          aria-hidden
        >
          <GarrettIcon name="person" size={18} className="text-primary" />
        </div>
      </div>
    </header>
  );
}
