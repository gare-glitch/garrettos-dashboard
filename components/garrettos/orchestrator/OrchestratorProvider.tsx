'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  runOrchestrator,
  executeIntent,
  createRequest,
} from '@/lib/garrettos/orchestrator/orchestrator';
import { getAIIntentMode } from '@/lib/garrettos/orchestrator/ai-router/mode';
import {
  appendAudit as appendAuditEntry,
  readAudit,
  clearAudit as clearAuditEntries,
  outcomeToEntry,
  type OrchestratorAuditEntry,
} from '@/lib/garrettos/orchestrator/audit-log';
import type {
  OrchestratorIntent,
  OrchestratorOptions,
  OrchestratorOutcome,
  OrchestratorRequest,
  OrchestratorResult,
  OrchestratorServices,
} from '@/lib/garrettos/orchestrator/types';
import type { TaskCreateInput } from '@/lib/garrettos/types';
import { useCommandPaletteContext } from '../CommandPaletteContext';

export interface OrchestratorContextValue {
  /** Run a request through the full pipeline. */
  orchestrate: (request: OrchestratorRequest) => Promise<OrchestratorOutcome>;
  /** Re-execute the most recent approval-gated intent with userConfirmed. */
  approvePending: () => Promise<OrchestratorResult>;
  /** Build a request stamped with the current page + source. */
  buildRequest: (
    input: Pick<OrchestratorRequest, 'source' | 'transcript'> &
      Partial<Omit<OrchestratorRequest, 'id' | 'createdAt' | 'source' | 'transcript' | 'currentPage'>>,
  ) => OrchestratorRequest;
  /** True when there is an approval-gated intent waiting. */
  hasPending: boolean;
  audit: OrchestratorAuditEntry[];
  clearAudit: () => void;
}

const OrchestratorContext = createContext<OrchestratorContextValue | null>(null);

/**
 * OrchestratorProvider — the single React binding for the central pipeline.
 *
 * Builds the injected services (router.push, task create POST, palette fallback)
 * from app-level hooks and exposes `orchestrate` + `approvePending` to every
 * input method (voice, command palette, future dashboard buttons). All side
 * effects flow through here; the core in lib/garrettos/orchestrator stays pure.
 */
export function OrchestratorProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { openPaletteWithQuery } = useCommandPaletteContext();

  const pendingRef = useRef<{ intent: OrchestratorOutcome['intent']; request: OrchestratorRequest } | null>(null);
  const [audit, setAudit] = useState<OrchestratorAuditEntry[]>(() => readAudit());

  const aiMode = getAIIntentMode();

  // AI resolver: the browser POSTs the transcript to the server route, which
  // runs the selected provider, validates the JSON, and returns a pure
  // OrchestratorIntent (or null → deterministic fallback). Upstream LLM keys
  // stay server-side; the browser only ever sees the validated intent.
  const aiResolve = useMemo<
    ((transcript: string) => Promise<OrchestratorIntent | null>) | undefined
  >(() => {
    if (aiMode === 'off') return undefined;
    return async (transcript: string): Promise<OrchestratorIntent | null> => {
      try {
        const res = await fetch('/api/garrettos/ai-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, mode: aiMode }),
        });
        const json = (await res.json()) as {
          data?: { intent?: OrchestratorIntent | null };
        };
        return json?.data?.intent ?? null;
      } catch {
        return null;
      }
    };
  }, [aiMode]);

  const options = useMemo<OrchestratorOptions>(
    () => ({ aiMode, aiResolve, navigationConfidenceThreshold: 0.9 }),
    [aiMode, aiResolve],
  );

  const services = useMemo<OrchestratorServices>(
    () => ({
      navigate: (href: string) => {
        router.push(href);
      },
      fallback: (transcript: string) => {
        openPaletteWithQuery(transcript);
      },
      createTask: async (input: TaskCreateInput) => {
        try {
          const res = await fetch('/api/garrettos/tasks/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          });
          const json = await res.json();
          const task = json?.data?.task;
          if (!res.ok || !task) {
            return { ok: false, error: json?.warning || `Request failed (${res.status})` };
          }
          return {
            ok: true,
            taskId: task.id,
            taskTitle: task.title,
            source: (json.data.source ?? 'mock') as 'server' | 'mock',
            warning: json.warning,
          };
        } catch {
          return { ok: false, error: 'Network error — task not created' };
        }
      },
    }),
    [router, openPaletteWithQuery],
  );

  const orchestrate = useCallback(
    async (request: OrchestratorRequest): Promise<OrchestratorOutcome> => {
      const outcome = await runOrchestrator(request, services, options);
      if (outcome.result.status === 'needs_approval' && outcome.result.pendingIntent) {
        pendingRef.current = { intent: outcome.result.pendingIntent, request };
      } else if (outcome.result.status !== 'needs_approval') {
        pendingRef.current = null;
      }
      setAudit(appendAuditEntry(outcomeToEntry(outcome)));
      return outcome;
    },
    [services, options],
  );

  const approvePending = useCallback(async (): Promise<OrchestratorResult> => {
    const pending = pendingRef.current;
    if (!pending) {
      return { status: 'failed', message: 'No pending action to approve.' };
    }
    const confirmedRequest: OrchestratorRequest = { ...pending.request, userConfirmed: true };
    const result = await executeIntent(pending.intent, confirmedRequest, services, options);
    pendingRef.current = null;
    // Record the approval outcome in the audit log too.
    const entry: OrchestratorAuditEntry = {
      auditId: `${pending.request.id}:approve`,
      source: pending.request.source,
      transcript: pending.request.transcript,
      intentType: pending.intent.type,
      status: result.status,
      message: String(result.message).slice(0, 200),
      requiresApproval: true,
      target: pending.intent.target,
      taskId: result.taskId,
      createdAt: new Date().toISOString(),
    };
    setAudit(appendAuditEntry(entry));
    return result;
  }, [services, options]);

  const buildRequest = useCallback<OrchestratorContextValue['buildRequest']>(
    (input) => createRequest({ ...input, currentPage: pathname ?? undefined }),
    [pathname],
  );

  const clearAudit = useCallback(() => {
    clearAuditEntries();
    setAudit([]);
  }, []);

  const value = useMemo<OrchestratorContextValue>(
    () => ({
      orchestrate,
      approvePending,
      buildRequest,
      hasPending: pendingRef.current !== null,
      audit,
      clearAudit,
    }),
    [orchestrate, approvePending, buildRequest, audit, clearAudit],
  );

  return <OrchestratorContext.Provider value={value}>{children}</OrchestratorContext.Provider>;
}

/** Access the central orchestrator. Must be used inside OrchestratorProvider. */
export function useOrchestrator(): OrchestratorContextValue {
  const ctx = useContext(OrchestratorContext);
  if (!ctx) {
    throw new Error('useOrchestrator must be used within OrchestratorProvider');
  }
  return ctx;
}
