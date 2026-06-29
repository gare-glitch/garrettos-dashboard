'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon } from '../GarrettIcon';
import { FluidGlassPanel } from '../motion';
import { SourceTag } from '../agent-ops/SessionMonitor';
import { useTaskComposer } from './TaskComposerContext';
import type { TaskAgent, TaskRun } from '@/lib/garrettos/types';

type Priority = 'low' | 'medium' | 'high';

const AGENTS: { id: TaskAgent; label: string; icon: string }[] = [
  { id: 'opencode', label: 'OpenCode', icon: 'code' },
  { id: 'claude', label: 'Claude', icon: 'smart_toy' },
  { id: 'openclaw', label: 'OpenClaw', icon: 'hub' },
  { id: 'manual', label: 'Manual', icon: 'person' },
];

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

const COMPOSIO_TOOLKITS: { id: string; label: string }[] = [
  { id: 'gmail', label: 'Gmail' },
  { id: 'google_calendar', label: 'Calendar' },
  { id: 'github', label: 'GitHub' },
  { id: 'slack', label: 'Slack' },
  { id: 'notion', label: 'Notion' },
];

export type TaskComposerResult = {
  task: TaskRun;
  source: 'server' | 'mock';
  warning?: string;
};

/**
 * TaskComposer — a panel for creating a queued task record. Calls
 * POST /api/garrettos/tasks/create, which writes a queued markdown file via
 * the bridge (server mode) or records locally (mock). Never executes.
 *
 * Renders as a slide-in drawer on /openclaw and as an embedded panel inside
 * the command palette's "New Task" flow.
 */
export function TaskComposer({
  open,
  onClose,
  onCreated,
  className,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (result: TaskComposerResult) => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { prefill, consumePrefill } = useTaskComposer();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [agent, setAgent] = useState<TaskAgent>('openclaw');
  const [priority, setPriority] = useState<Priority>('medium');
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [targetRepo, setTargetRepo] = useState('');
  const [composioTools, setComposioTools] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TaskComposerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'voice' | 'manual' | undefined>(undefined);

  // Apply a voice "Edit in composer" prefill when the composer opens.
  useEffect(() => {
    if (open && prefill) {
      setTitle(prefill.title ?? '');
      setDescription(prefill.description ?? '');
      if (prefill.agent) setAgent(prefill.agent);
      if (typeof prefill.requiresApproval === 'boolean') setRequiresApproval(prefill.requiresApproval);
      if (prefill.composioTools) setComposioTools(prefill.composioTools);
      setSource(prefill.source);
      setResult(null);
      setError(null);
      consumePrefill();
    }
  }, [open, prefill, consumePrefill]);

  function reset() {
    setTitle('');
    setDescription('');
    setAgent('openclaw');
    setPriority('medium');
    setRequiresApproval(true);
    setTargetRepo('');
    setComposioTools([]);
    setSource(undefined);
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/garrettos/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          agent,
          priority,
          requiresApproval,
          targetRepo: targetRepo.trim() || undefined,
          composioTools: composioTools.length > 0 ? composioTools : undefined,
          source,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.data?.task) {
        setError(json?.warning || `Request failed (${res.status})`);
        setSubmitting(false);
        return;
      }
      const created: TaskComposerResult = {
        task: json.data.task as TaskRun,
        source: json.data.source as 'server' | 'mock',
        warning: json.warning,
      };
      setResult(created);
      onCreated?.(created);
    } catch {
      setError('Network error — task not created');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn('fixed inset-0 z-[55] flex justify-end', className)}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="New task"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-[#021018]/40"
            onClick={onClose}
            aria-label="Close task composer"
            tabIndex={-1}
          />
          <motion.div
            className="relative h-dvh w-full max-w-md"
            initial={reduceMotion ? { x: 0 } : { x: 40 }}
            animate={{ x: 0 }}
            exit={reduceMotion ? { x: 0 } : { x: 40 }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 34 }}
          >
            <FluidGlassPanel
              variant="active"
              interactive={false}
              rounded="rounded-l-2xl"
              className="h-full overflow-y-auto p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                    <GarrettIcon name="add_task" size={18} className="text-primary" />
                  </span>
                  <h2 className={typography.headlineMd}>New task</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-white/5 hover:text-primary"
                  aria-label="Close"
                >
                  <GarrettIcon name="close" size={18} />
                </button>
              </div>

              <p className={cn(typography.body, 'mt-1 text-[12px] text-on-surface-variant')}>
                Creates a queued task record. Nothing executes — approval-gated by default.
              </p>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <Field label="Title" required>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={160}
                    placeholder="e.g. Index new Obsidian vault"
                    className={inputClass}
                    autoFocus
                    required
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={4000}
                    rows={4}
                    placeholder="What should the agent do? Be specific about scope."
                    className={cn(inputClass, 'resize-y')}
                  />
                </Field>

                <Field label="Agent">
                  <div className="grid grid-cols-2 gap-2">
                    {AGENTS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAgent(a.id)}
                        aria-pressed={agent === a.id}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                          agent === a.id
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-white/8 bg-white/[0.02] text-on-surface-variant hover:border-primary/20',
                        )}
                      >
                        <GarrettIcon name={a.icon} size={16} />
                        <span className={cn(typography.bodySm, 'font-medium')}>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Priority">
                  <div className="flex gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        aria-pressed={priority === p.id}
                        className={cn(
                          'flex-1 rounded-lg border px-3 py-2 label-caps text-[11px] transition-colors',
                          priority === p.id
                            ? p.id === 'high'
                              ? 'border-error/40 bg-error/10 text-error'
                              : p.id === 'medium'
                                ? 'border-primary/40 bg-primary/10 text-primary'
                                : 'border-secondary/40 bg-secondary/10 text-secondary'
                            : 'border-white/8 bg-white/[0.02] text-on-surface-variant hover:border-primary/20',
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Target repo / project">
                  <input
                    value={targetRepo}
                    onChange={(e) => setTargetRepo(e.target.value)}
                    maxLength={240}
                    placeholder="e.g. garrettos-dashboard"
                    className={inputClass}
                  />
                </Field>

                <Field label="Composio tools (optional)">
                  <div className="flex flex-wrap gap-1.5">
                    {COMPOSIO_TOOLKITS.map((tk) => {
                      const active = composioTools.includes(tk.id);
                      return (
                        <button
                          key={tk.id}
                          type="button"
                          onClick={() =>
                            setComposioTools((prev) =>
                              active ? prev.filter((t) => t !== tk.id) : [...prev, tk.id],
                            )
                          }
                          aria-pressed={active}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                            active
                              ? 'border-secondary/40 bg-secondary/10 text-secondary'
                              : 'border-white/8 bg-white/[0.02] text-on-surface-variant hover:border-secondary/20',
                          )}
                        >
                          {tk.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-[10px] text-outline">
                    External actions the agent may use during the run. Destructive actions still require approval.
                  </p>
                </Field>

                <label className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5">
                  <span>
                    <span className={cn(typography.bodySm, 'font-medium')}>Requires approval</span>
                    <span className="block text-[10px] text-outline">No execution until a human approves</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setRequiresApproval((v) => !v)}
                    className={cn(
                      'relative h-5 w-9 rounded-full transition-colors',
                      requiresApproval ? 'bg-secondary/60' : 'bg-surface-container-highest',
                    )}
                    role="switch"
                    aria-checked={requiresApproval}
                    aria-label="Requires approval"
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 size-4 rounded-full bg-on-surface transition-transform',
                        requiresApproval ? 'translate-x-4' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                </label>

                {error ? (
                  <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-[12px] text-error">{error}</p>
                ) : null}

                {result ? (
                  <div className="rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <p className={cn(typography.bodySm, 'font-medium text-secondary')}>
                        Queued: {result.task.title}
                      </p>
                      <SourceTag source={result.source} count={1} label="record" />
                    </div>
                    {result.warning ? (
                      <p className="mt-1 text-[10px] text-primary/80">{result.warning}</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={reset}
                      className="mt-2 text-[11px] text-primary hover:underline"
                    >
                      Create another
                    </button>
                  </div>
                ) : null}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={!title.trim() || submitting}
                    className={cn(
                      'flex-1 rounded-lg bg-primary px-4 py-2.5 label-caps text-on-primary transition-opacity',
                      'outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      (!title.trim() || submitting) && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    {submitting ? 'Queuing…' : 'Queue task'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-white/10 px-4 py-2.5 label-caps text-on-surface-variant transition-colors hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </FluidGlassPanel>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const inputClass = cn(
  'w-full rounded-lg border border-white/8 bg-surface-container-low/40 px-3 py-2 text-body-sm text-on-surface',
  'outline-none transition-colors placeholder:text-outline/60',
  'focus:border-primary/40 focus:bg-surface-container/40',
);

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={cn(typography.labelCaps, 'mb-1.5 block text-[10px] text-on-surface-variant')}>
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </label>
      {children}
    </div>
  );
}
