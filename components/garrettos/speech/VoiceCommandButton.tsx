'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GarrettIcon } from '../GarrettIcon';
import { useMotionPreferences } from '../motion';
import type { VoiceState } from '@/lib/garrettos/speech/types';

const STATE_CLASS: Record<VoiceState, string> = {
  idle: 'border-white/10 bg-white/5 text-on-surface-variant hover:text-primary hover:border-primary/30',
  listening: 'border-tertiary/40 bg-tertiary/15 text-tertiary',
  thinking: 'border-primary/40 bg-primary/15 text-primary',
  speaking: 'border-secondary/40 bg-secondary/15 text-secondary',
  unsupported: 'border-white/10 bg-white/5 text-outline',
  error: 'border-error/40 bg-error/15 text-error',
};

/**
 * VoiceCommandButton — a compact, magnetic-feeling mic button. Toggles
 * listening on click. Shows the current voice state through border/text color
 * and a subtle scale pulse while active. Non-intrusive; fits a 36px action slot.
 */
export function VoiceCommandButton({
  state,
  supported,
  onStart,
  onStop,
  className,
  size = 20,
  ariaLabel = 'Talk to GarrettOS',
}: {
  state: VoiceState;
  supported: boolean;
  onStart: () => void;
  onStop: () => void;
  className?: string;
  size?: number;
  ariaLabel?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { mode } = useMotionPreferences();
  const animate = !reduceMotion && mode !== 'minimal';
  const active = state === 'listening' || state === 'thinking';
  const disabled = !supported && state !== 'unsupported';

  function handleClick() {
    if (!supported) return;
    if (active) onStop();
    else onStart();
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        'flex size-9 items-center justify-center rounded-lg border transition-colors',
        'outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        STATE_CLASS[state],
        className,
      )}
      animate={animate && active ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={animate && active ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
      whileTap={animate ? { scale: 0.94 } : undefined}
    >
      <GarrettIcon
        name={state === 'listening' ? 'mic' : state === 'unsupported' ? 'mic_off' : 'mic_none'}
        size={size}
        fill={active}
      />
    </motion.button>
  );
}
