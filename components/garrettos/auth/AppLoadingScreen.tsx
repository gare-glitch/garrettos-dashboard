'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { fadeIn, springs } from '@/lib/motion';
import { BreathingPip } from '../BreathingPip';
import { GarrettIcon } from '../GarrettIcon';

export function AppLoadingScreen({
  title = 'Entering GarrettOS',
  subtitle = 'Preparing your command workspace…',
  className,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#021018]',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 size-[480px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute bottom-0 right-0 size-[320px] rounded-full bg-tertiary/6 blur-[100px]" />
      </div>

      <motion.div
        variants={fadeIn}
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        className="relative flex flex-col items-center gap-6 px-6 text-center"
      >
        <motion.div
          className="flex size-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-[0_0_48px_rgba(236,189,164,0.12)]"
          animate={reduceMotion ? undefined : { scale: [1, 1.03, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-2xl font-bold tracking-tighter text-primary">G</span>
        </motion.div>

        <div className="space-y-2">
          <h1 className={typography.headline}>{title}</h1>
          <p className={typography.body}>{subtitle}</p>
        </div>

        <SyncingMemoryLoader />
      </motion.div>
    </div>
  );
}

export function SyncingMemoryLoader({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <BreathingPip tone="primary" pulse={!reduceMotion} />
      <span className={cn(typography.mono, 'text-on-surface-variant')}>Syncing memory</span>
      {!reduceMotion ? (
        <motion.span
          className="inline-flex gap-1"
          aria-hidden
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.8 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1 rounded-full bg-primary/60"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </motion.span>
      ) : null}
    </div>
  );
}

export function LoginLoadingState({ message = 'Sending secure link…' }: { message?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.soft}
      className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-white/8 bg-surface-container/40 px-4 py-4"
      role="status"
      aria-live="polite"
    >
      <GarrettIcon name="lock" size={20} className="text-primary" />
      <p className={cn(typography.body, 'text-center')}>{message}</p>
      <SyncingMemoryLoader />
    </motion.div>
  );
}
