'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { useMotionPreferences } from './MotionProvider';
import { orbBreath } from '@/lib/living-motion';

/**
 * AgentThinkingOrb — a calm, concentric "agent thinking" indicator.
 *
 * Three nested rings breathe at slightly offset tempos with a sand glow core.
 * Inspired by Apple Vision Pro / OpenAI ambient states — NOT a spinner.
 *
 * Use for: agent running, model routing, long-running agent tasks.
 * Do NOT use for: page loads (use Skeleton), short ticks (use ThinkingLoader).
 */
export function AgentThinkingOrb({
  label = 'Agent thinking',
  size = 56,
  className,
}: {
  label?: string;
  size?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { ambientEnabled } = useMotionPreferences();
  const animate = ambientEnabled && !reduceMotion;

  return (
    <div className={cn('flex items-center gap-3', className)} role="status" aria-live="polite">
      <div className="relative" style={{ width: size, height: size }}>
        {animate ? (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border border-primary/30"
              variants={orbBreath}
              animate="breathe"
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-[18%] rounded-full border border-primary/40"
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
            <motion.div
              className="absolute inset-[36%] rounded-full bg-primary/40"
              style={{ filter: 'blur(2px)' }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0 rounded-full border border-primary/30" />
            <div className="absolute inset-[18%] rounded-full border border-primary/40" />
            <div className="absolute inset-[36%] rounded-full bg-primary/40" />
          </>
        )}
      </div>
      {label ? <span className={cn(typography.labelCaps, 'text-primary')}>{label}</span> : null}
    </div>
  );
}
