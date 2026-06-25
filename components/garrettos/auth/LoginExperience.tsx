'use client';

import { useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { scaleIn } from '@/lib/motion';
import { GarrettIcon } from '../GarrettIcon';
import { GlassPanel } from '../GlassPanel';
import { LoginLoadingState } from './AppLoadingScreen';
import { FluidGlassPanel, MagneticButton } from '../motion';

export function LoginGlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={scaleIn}
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      className={cn('relative w-full max-w-md', className)}
    >
      <FluidGlassPanel
        variant="active"
        interactive
        rounded="rounded-2xl"
        highlightOpacity={0.1}
      >
        <div className="p-6 md:p-8">{children}</div>
      </FluidGlassPanel>
    </motion.div>
  );
}

export function GarrettOSMark() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mb-6 flex items-center gap-3">
      <motion.div
        className="flex size-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10"
        animate={reduceMotion ? undefined : { boxShadow: ['0 0 0 rgba(236,189,164,0)', '0 0 32px rgba(236,189,164,0.15)', '0 0 0 rgba(236,189,164,0)'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-lg font-bold tracking-tighter text-primary">G</span>
      </motion.div>
      <div>
        <p className={typography.eyebrowPrimary}>Private access</p>
        <h1 className={typography.headlineMd}>Sign in to GarrettOS</h1>
      </div>
    </div>
  );
}

export function LoginForm({
  email,
  onEmailChange,
  onSubmit,
  loading,
  message,
}: {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  message: string;
}) {
  return (
    <>
      <p className={cn(typography.body, 'mb-5')}>
        Supabase Auth gates the dashboard. No service-role keys are used in the browser.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-3"
      >
        <label htmlFor="login-email" className="sr-only">
          Email address
        </label>
        <input
          id="login-email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          disabled={loading}
          required
          className={cn(
            'w-full rounded-xl border border-white/10 bg-surface-container-lowest/80 px-4 py-3',
            'text-body-sm text-on-surface placeholder:text-outline/50',
            'transition-colors focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30',
            'disabled:opacity-60',
          )}
        />

        <MagneticButton
          type="submit"
          variant="primary"
          disabled={loading || !email.trim()}
          className="w-full"
          strength={0.18}
          maxDisplacement={4}
        >
          <GarrettIcon name="auto_awesome" size={18} />
          {loading ? 'Sending…' : 'Send magic link'}
        </MagneticButton>
      </form>

      {loading ? <LoginLoadingState /> : null}

      <p
        className={cn(typography.body, 'mt-4 text-center')}
        role={message.includes('sent') ? 'status' : undefined}
        aria-live="polite"
      >
        {message}
      </p>
    </>
  );
}
