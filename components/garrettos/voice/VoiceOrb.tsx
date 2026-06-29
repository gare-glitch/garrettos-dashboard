'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GarrettIcon } from '../GarrettIcon';
import { useMotionPreferences } from '../motion';
import type { VoicePhase } from '@/lib/garrettos/voice/voice-types';

const PHASE_ACCENT: Record<VoicePhase, string> = {
  idle: 'text-outline',
  listening: 'text-tertiary',
  transcribing: 'text-tertiary',
  interpreting: 'text-primary',
  needs_approval: 'text-primary',
  queued: 'text-secondary',
  completed: 'text-secondary',
  error: 'text-error',
  unsupported: 'text-outline',
};

const PHASE_GLOW: Record<VoicePhase, string> = {
  idle: 'bg-outline/10',
  listening: 'bg-tertiary/15',
  transcribing: 'bg-tertiary/20',
  interpreting: 'bg-primary/15',
  needs_approval: 'bg-primary/15',
  queued: 'bg-secondary/15',
  completed: 'bg-secondary/15',
  error: 'bg-error/15',
  unsupported: 'bg-outline/5',
};

const PHASE_ICON: Record<VoicePhase, string> = {
  idle: 'mic_none',
  listening: 'mic',
  transcribing: 'mic',
  interpreting: 'psychology',
  needs_approval: 'gpp_maybe',
  queued: 'task_alt',
  completed: 'check_circle',
  error: 'error',
  unsupported: 'mic_off',
};

/**
 * VoiceOrb — a calm, phase-aware concentric indicator for the M13 voice layer.
 * Three nested rings breathe at offset tempos while listening/transcribing and
 * settle still otherwise. A subtle outer halo swells while listening.
 *
 * Reduced motion / minimal mode: rings render statically, no breathing.
 */
export function VoiceOrb({
  phase,
  size = 96,
  className,
}: {
  phase: VoicePhase;
  size?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { mode } = useMotionPreferences();
  const animate = !reduceMotion && mode !== 'minimal';
  const active = phase === 'listening' || phase === 'transcribing';
  const thinking = phase === 'interpreting' || phase === 'needs_approval';

  const ringSize = [size, size * 0.74, size * 0.5];

  return (
    <span
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Outer halo — swells only while listening */}
      <motion.span
        className={cn('absolute rounded-full', PHASE_GLOW[phase])}
        style={{ width: size * 1.18, height: size * 1.18 }}
        animate={animate && active ? { scale: [1, 1.08, 1], opacity: [0.25, 0.5, 0.25] } : { scale: 1, opacity: 0.2 }}
        transition={animate && active ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
      />
      {ringSize.map((s, i) => (
        <motion.span
          key={i}
          className={cn('absolute rounded-full border', PHASE_GLOW[phase], PHASE_ACCENT[phase])}
          style={{ width: s, height: s, borderWidth: 1 }}
          animate={
            animate && (active || thinking)
              ? { scale: [1, 1.05, 1], opacity: [0.45, 0.8, 0.45] }
              : { scale: 1, opacity: 0.5 }
          }
          transition={
            animate && (active || thinking)
              ? { duration: 2.2 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0 }
          }
        />
      ))}
      <motion.span
        className={cn(
          'relative flex items-center justify-center rounded-full',
          PHASE_GLOW[phase],
          PHASE_ACCENT[phase],
        )}
        style={{ width: size * 0.38, height: size * 0.38 }}
        animate={animate && (active || thinking) ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={animate && (active || thinking) ? { duration: 1.7, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
      >
        <GarrettIcon name={PHASE_ICON[phase]} size={Math.round(size * 0.18)} fill />
      </motion.span>
    </span>
  );
}
