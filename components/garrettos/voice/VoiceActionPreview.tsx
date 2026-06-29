'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon } from '../GarrettIcon';
import { actionLabel } from '@/lib/garrettos/voice/action-router';
import type { VoiceAction, VoicePhase, VoiceTaskResult } from '@/lib/garrettos/voice/voice-types';

/**
 * VoiceActionPreview — shows what GarrettOS will do and surfaces the approval
 * gate. Navigation offers a single "Open" action. Task actions offer "Queue"
 * (approval-gated for mutating) and "Edit in composer". Unknown offers a
 * fallback to the command palette. Never executes on render — all actions are
 * callback-driven so the parent (VoiceProvider) remains the single executor.
 */
export function VoiceActionPreview({
  action,
  phase,
  lastResult,
  submitting,
  onApprove,
  onEditInComposer,
  onNavigate,
  onFallback,
  onDismiss,
  className,
}: {
  action: VoiceAction;
  phase: VoicePhase;
  lastResult: VoiceTaskResult | null;
  submitting?: boolean;
  onApprove: () => void;
  onEditInComposer: () => void;
  onNavigate: () => void;
  onFallback: () => void;
  onDismiss: () => void;
  className?: string;
}) {
  // Terminal states — show the outcome instead of buttons.
  if (phase === 'queued' && lastResult?.ok) {
    return (
      <ResultBanner
        tone="good"
        icon="task_alt"
        title="Task queued"
        detail={
          lastResult.taskId
            ? `${lastResult.taskTitle ?? 'Task'} · ${lastResult.source ?? 'mock'} · ${lastResult.taskId}`
            : `${lastResult.taskTitle ?? 'Task'} · ${lastResult.source ?? 'mock'}`
        }
        onDismiss={onDismiss}
        className={className}
      />
    );
  }
  if (phase === 'error' && lastResult && !lastResult.ok) {
    return (
      <ResultBanner
        tone="bad"
        icon="error"
        title="Couldn't queue task"
        detail={lastResult.error ?? 'Task creation failed'}
        onDismiss={onDismiss}
        className={className}
      />
    );
  }

  return (
    <motion.div
      className={cn('w-full space-y-2.5', className)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
        <GarrettIcon
          name={action.type === 'navigate' ? 'route' : action.type === 'fallback' ? 'search' : 'add_task'}
          size={15}
          className="text-primary"
        />
        <span className={cn(typography.bodySm, 'font-medium')}>{actionLabel(action)}</span>
      </div>

      {action.type === 'queue-task' ? (
        <p className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.06] px-3 py-2 text-[11px] text-primary/90">
          <GarrettIcon name="lock" size={12} />
          This action mutates state — it will queue a task requiring your approval before anything runs.
        </p>
      ) : null}
      {action.type === 'review-task' ? (
        <p className="flex items-center gap-1.5 rounded-lg border border-secondary/20 bg-secondary/[0.06] px-3 py-2 text-[11px] text-secondary/90">
          <GarrettIcon name="check" size={12} />
          Read-only — creates a review task for an agent to gather and summarize.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {action.type === 'navigate' ? (
          <PrimaryButton onClick={onNavigate} icon="arrow_forward">
            Open {action.route.label}
          </PrimaryButton>
        ) : action.type === 'fallback' ? (
          <PrimaryButton onClick={onFallback} icon="search">
            Open command palette
          </PrimaryButton>
        ) : (
          <>
            <PrimaryButton onClick={onApprove} icon="send" disabled={submitting}>
              {submitting ? 'Queuing…' : action.type === 'queue-task' ? 'Queue task' : 'Create review task'}
            </PrimaryButton>
            <SecondaryButton onClick={onEditInComposer} icon="edit">
              Edit in composer
            </SecondaryButton>
          </>
        )}
        <SecondaryButton onClick={onDismiss} icon="close">
          Dismiss
        </SecondaryButton>
      </div>
    </motion.div>
  );
}

function PrimaryButton({
  children,
  onClick,
  icon,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 label-caps text-[11px] text-on-primary transition-opacity',
        'outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <GarrettIcon name={icon} size={14} />
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 label-caps text-[11px] text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
    >
      <GarrettIcon name={icon} size={14} />
      {children}
    </button>
  );
}

function ResultBanner({
  tone,
  icon,
  title,
  detail,
  onDismiss,
  className,
}: {
  tone: 'good' | 'bad';
  icon: string;
  title: string;
  detail: string;
  onDismiss: () => void;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(
        'w-full rounded-xl border p-3',
        tone === 'good' ? 'border-secondary/30 bg-secondary/10' : 'border-error/30 bg-error/10',
        className,
      )}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <GarrettIcon
          name={icon}
          size={18}
          className={tone === 'good' ? 'text-secondary' : 'text-error'}
        />
        <div className="min-w-0 flex-1">
          <p className={cn(typography.bodySm, 'font-medium', tone === 'good' ? 'text-secondary' : 'text-error')}>
            {title}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-on-surface-variant">{detail}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-1.5 py-0.5 text-[10px] text-on-surface-variant transition-colors hover:bg-white/5"
        >
          Done
        </button>
      </div>
    </motion.div>
  );
}
