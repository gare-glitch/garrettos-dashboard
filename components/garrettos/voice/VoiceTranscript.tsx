'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon } from '../GarrettIcon';

/**
 * VoiceTranscript — live transcript with interim (muted) + final (bright)
 * lines. interim updates in place while listening; final locks in once parsed.
 */
export function VoiceTranscript({
  interim,
  finalTranscript,
  phase,
  className,
}: {
  interim: string;
  finalTranscript: string;
  phase: 'idle' | 'listening' | 'transcribing' | 'interpreting' | 'needs_approval' | 'queued' | 'error' | 'unsupported';
  className?: string;
}) {
  const hasText = Boolean(interim || finalTranscript);
  const listening = phase === 'listening' || phase === 'transcribing';

  return (
    <div className={cn('min-h-[2.5rem] w-full text-center', className)} aria-live="polite">
      <AnimatePresence mode="wait">
        {finalTranscript ? (
          <motion.p
            key="final"
            className={cn(typography.bodyLg, 'text-on-surface')}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            &ldquo;{finalTranscript}&rdquo;
          </motion.p>
        ) : interim ? (
          <motion.p
            key="interim"
            className={cn(typography.bodyLg, 'text-on-surface-variant')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {interim}
            <span className="ml-0.5 inline-block w-px animate-pulse text-primary">|</span>
          </motion.p>
        ) : listening ? (
          <motion.p
            key="listening"
            className={cn(typography.body, 'text-on-surface-variant')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GarrettIcon name="mic" size={14} className="mr-1.5 align-[-2px] text-tertiary" />
            Listening…
          </motion.p>
        ) : hasText ? null : null}
      </AnimatePresence>
    </div>
  );
}
