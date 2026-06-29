'use client';

import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import type { VoiceAction, VoiceIntent, VoicePhase, VoiceTaskResult } from '@/lib/garrettos/voice/voice-types';
import type { AIVoiceMode } from '@/lib/garrettos/voice/ai-intent-router';

/**
 * VoiceDebugPanel — a compact, read-only diagnostics surface for the voice
 * command path. Shows the transcript, parsed intent, action type, target route,
 * the task payload that would be POSTed, the current phase, the AI mode, and the
 * last error/result. Intended for development + support; never executes.
 */
export function VoiceDebugPanel({
  phase,
  transcript,
  intent,
  action,
  lastResult,
  error,
  aiMode,
  supported,
  className,
}: {
  phase: VoicePhase;
  transcript: string;
  intent: VoiceIntent | null;
  action: VoiceAction | null;
  lastResult: VoiceTaskResult | null;
  error: string | null;
  aiMode: AIVoiceMode;
  supported: boolean;
  className?: string;
}) {
  const taskPayload = intent
    ? {
        title: intent.taskTitle ?? null,
        description: intent.taskDescription ?? null,
        agent: intent.agent ?? null,
        priority: 'medium',
        requiresApproval: intent.requiresApproval,
        composioTools: intent.composioTools ?? null,
        source: 'voice',
        transcript: intent.transcript,
        intent: intent.id,
      }
    : null;

  const rows: { k: string; v: string }[] = [
    { k: 'state', v: phase },
    { k: 'supported', v: String(supported) },
    { k: 'ai mode', v: aiMode },
    { k: 'transcript', v: transcript || '—' },
    { k: 'intent id', v: intent?.id ?? '—' },
    { k: 'intent kind', v: intent?.kind ?? '—' },
    { k: 'action type', v: action?.type ?? '—' },
    { k: 'target route', v: action?.type === 'navigate' ? action.route.href : '—' },
    { k: 'requires approval', v: intent ? String(intent.requiresApproval) : '—' },
    { k: 'last error', v: error ?? '—' },
    {
      k: 'last result',
      v: lastResult
        ? `${lastResult.ok ? 'ok' : 'fail'}${lastResult.taskId ? ` · ${lastResult.taskId}` : ''}${
            lastResult.source ? ` · ${lastResult.source}` : ''
          }`
        : '—',
    },
  ];

  return (
    <div
      className={cn(
        'w-full max-w-md rounded-xl border border-white/8 bg-[#021018]/60 p-3 text-left font-mono text-[10px] leading-relaxed text-outline',
        className,
      )}
      aria-label="Voice debug panel"
    >
      <p className={cn(typography.labelCaps, 'mb-2 text-[9px] text-outline/70')}>Debug</p>
      <dl className="space-y-1">
        {rows.map((r) => (
          <div key={r.k} className="flex gap-2">
            <dt className="w-28 shrink-0 text-outline/70">{r.k}</dt>
            <dd className="min-w-0 flex-1 break-words text-on-surface-variant">{r.v}</dd>
          </div>
        ))}
      </dl>
      <p className={cn(typography.labelCaps, 'mb-1 mt-2 text-[9px] text-outline/70')}>Task payload</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[9px] text-on-surface-variant">
        {taskPayload ? JSON.stringify(taskPayload, null, 2) : '—'}
      </pre>
    </div>
  );
}
