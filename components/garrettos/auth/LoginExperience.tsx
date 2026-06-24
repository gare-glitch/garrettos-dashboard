'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { scaleIn } from '@/lib/motion';
import { GarrettIcon } from '../GarrettIcon';
import { GlassPanel } from '../GlassPanel';
import { LoginLoadingState } from './AppLoadingScreen';

export function LoginGlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ref.current.style.setProperty('--mouse-x', `${x}px`);
      ref.current.style.setProperty('--mouse-y', `${y}px`);
    },
    [reduceMotion],
  );

  return (
    <motion.div
      ref={ref}
      variants={scaleIn}
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      onMouseMove={onMouseMove}
      className={cn('relative w-full max-w-md', className)}
      style={
        {
          '--mouse-x': '50%',
          '--mouse-y': '50%',
        } as React.CSSProperties
      }
    >
      {!reduceMotion ? (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-60"
          style={{
            background:
              'radial-gradient(420px circle at var(--mouse-x) var(--mouse-y), rgba(236,189,164,0.09), transparent 42%)',
          }}
          aria-hidden
        />
      ) : null}
      <GlassPanel variant="panel" className="relative overflow-hidden p-6 md:p-8 glow-ring">
        {children}
      </GlassPanel>
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

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3',
            'text-body-sm font-semibold text-on-primary transition-transform',
            'hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <GarrettIcon name="auto_awesome" size={18} />
          {loading ? 'Sending…' : 'Send magic link'}
        </button>
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
