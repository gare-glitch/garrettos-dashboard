'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GarrettIcon } from '../GarrettIcon';
import { useMotionPreferences } from '../motion';
import type { VoiceState } from '@/lib/garrettos/speech/types';

const STATE_ACCENT: Record<VoiceState, string> = {
  idle: 'text-outline',
  listening: 'text-tertiary',
  thinking: 'text-primary',
  speaking: 'text-secondary',
  unsupported: 'text-outline',
  error: 'text-error',
};

const STATE_GLOW: Record<VoiceState, string> = {
  idle: 'bg-outline/10',
  listening: 'bg-tertiary/15',
  thinking: 'bg-primary/15',
  speaking: 'bg-secondary/15',
  unsupported: 'bg-outline/5',
  error: 'bg-error/15',
};

/**
 * SpeechOrb — a calm concentric indicator for voice states. Three nested rings
 * breathe at offset tempos while listening/thinking/speaking, and sit still
 * otherwise. Replaces a generic mic spinner with something premium and quiet.
 *
 * Reduced motion: rings render statically (no breathing) and the orb is still.
 */
export function SpeechOrb({
  state,
  size = 40,
  className,
}: {
  state: VoiceState;
  size?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { mode } = useMotionPreferences();
  const animate = !reduceMotion && mode !== 'minimal';
  const active = state === 'listening' || state === 'thinking' || state === 'speaking';

  const ringSize = [size, size * 0.72, size * 0.5];

  return (
    <span
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {ringSize.map((s, i) => (
        <motion.span
          key={i}
          className={cn('absolute rounded-full border', STATE_GLOW[state], STATE_ACCENT[state])}
          style={{ width: s, height: s, borderWidth: 1 }}
          animate={
            animate && active
              ? { scale: [1, 1.06, 1], opacity: [0.5, 0.85, 0.5] }
              : { scale: 1, opacity: 0.5 }
          }
          transition={
            animate && active
              ? { duration: 2.2 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0 }
          }
        />
      ))}
      <motion.span
        className={cn(
          'relative flex items-center justify-center rounded-full',
          STATE_GLOW[state],
          STATE_ACCENT[state],
        )}
        style={{ width: size * 0.36, height: size * 0.36 }}
        animate={animate && active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={animate && active ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
      >
        <GarrettIcon
          name={state === 'listening' ? 'mic' : state === 'speaking' ? 'volume_up' : state === 'thinking' ? 'psychology' : state === 'error' ? 'error' : 'mic_none'}
          size={Math.round(size * 0.18)}
          fill
        />
      </motion.span>
    </span>
  );
}
