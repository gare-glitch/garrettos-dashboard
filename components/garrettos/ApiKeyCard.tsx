'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon } from './GarrettIcon';
import { GlassPanel } from './GlassPanel';
import { ScrollReveal } from './ScrollReveal';
import { StaggerItem, StaggerReveal } from './ScrollReveal';
import { StatusChip } from './StatusChip';

export type ApiKeyCardProps = {
  name: string;
  maskedKey?: string;
  lastUsed?: string;
  status: string;
  tone: 'good' | 'warn' | 'info' | 'bad' | 'idle';
  env?: string[];
  nextStep?: string;
};

export function ApiKeyCard({
  name,
  maskedKey,
  lastUsed,
  status,
  tone,
  env,
  nextStep,
}: ApiKeyCardProps) {
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();

  function copy() {
    if (!maskedKey) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <GlassPanel
      variant="card"
      interactive
      className="p-4 md:p-5"
      as="article"
      aria-label={`${name} API key`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={typography.labelCaps}>{name}</p>
          {maskedKey ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/5 bg-surface-container-lowest/50 p-2">
              <GarrettIcon name="lock" size={16} className="text-outline" />
              <code className={cn(typography.code, 'flex-1 truncate text-primary')}>
                {maskedKey}
              </code>
              <button
                type="button"
                onClick={copy}
                className="rounded-md p-1.5 transition-colors hover:bg-primary/20"
                aria-label={`Copy ${name} key`}
              >
                <motion.span
                  key={copied ? 'check' : 'copy'}
                  initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={springsSoft()}
                >
                  <GarrettIcon name={copied ? 'check' : 'content_copy'} size={16} className={copied ? 'text-secondary' : 'text-primary'} />
                </motion.span>
              </button>
            </div>
          ) : null}
          {env && env.length > 0 ? (
            <p className="mt-2 font-mono text-[10px] text-outline">{env.join(', ')}</p>
          ) : null}
          {nextStep ? <p className={cn(typography.body, 'mt-1')}>{nextStep}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusChip label={status} tone={tone} showPip size="inline" />
          {lastUsed ? (
            <p className="font-mono text-[10px] text-outline">{lastUsed}</p>
          ) : null}
        </div>
      </div>
    </GlassPanel>
  );
}

function springsSoft() {
  return { type: 'spring' as const, stiffness: 380, damping: 28 };
}

export function ApiKeyGroup({
  title,
  icon,
  items,
}: {
  title: string;
  icon: string;
  items: ApiKeyCardProps[];
}) {
  return (
    <ScrollReveal>
      <div className="mb-4 flex items-center gap-3">
        <GarrettIcon name={icon} size={22} className="text-primary" />
        <h3 className={typography.headlineMd}>{title}</h3>
      </div>
      <StaggerReveal className="space-y-3">
        {items.map((item) => (
          <StaggerItem key={item.name}>
            <ApiKeyCard {...item} />
          </StaggerItem>
        ))}
      </StaggerReveal>
    </ScrollReveal>
  );
}

export function SecurityAlert({
  title,
  message,
  actionLabel = 'Fix security issues',
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-error/20 bg-error-container/10 p-4 sm:flex-row sm:items-center sm:gap-4 md:p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error/20">
        <GarrettIcon name="gpp_maybe" size={22} className="text-error" />
      </div>
      <div className="flex-1">
        <p className={cn(typography.bodyLg, 'font-bold text-error')}>{title}</p>
        <p className={typography.body}>{message}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 self-start font-semibold text-error underline-offset-4 hover:underline sm:self-auto"
      >
        {actionLabel}
      </button>
    </div>
  );
}
