/**
 * Orchestrator audit log (M14A).
 *
 * A small client-side ring buffer of recent orchestrator requests/results, kept
 * in localStorage. No secrets are ever stored — only the transcript, intent
 * type, status, and timestamps. Capped at MAX entries. SSR-safe.
 */
import type {
  OrchestratorIntentType,
  OrchestratorOutcome,
  OrchestratorSource,
  OrchestratorStatus,
} from './types';

const STORAGE_KEY = 'garrettos.orchestrator.audit.v1';
export const AUDIT_MAX = 10;

export interface OrchestratorAuditEntry {
  auditId: string;
  source: OrchestratorSource;
  transcript: string;
  intentType: OrchestratorIntentType;
  status: OrchestratorStatus;
  message: string;
  requiresApproval: boolean;
  target?: string;
  taskId?: string;
  createdAt: string;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Read the current audit log (newest first). SSR returns []. */
export function readAudit(): OrchestratorAuditEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OrchestratorAuditEntry[]) : [];
  } catch {
    return [];
  }
}

/** Convert an orchestrator outcome to a safe audit entry (no secrets). */
export function outcomeToEntry(outcome: OrchestratorOutcome): OrchestratorAuditEntry {
  const { intent, result, auditId } = outcome;
  // Defensive: never persist arbitrary payload data — only safe scalar fields.
  return {
    auditId,
    source: (intent.payload.source as OrchestratorSource) ?? 'voice',
    transcript: String(intent.payload.transcript ?? '').slice(0, 200),
    intentType: intent.type,
    status: result.status,
    message: String(result.message).slice(0, 200),
    requiresApproval: intent.requiresApproval,
    target: intent.target,
    taskId: result.taskId,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Append an entry to the log, returning the new list (newest first, capped).
 * Also writes to localStorage. SSR is a no-op (returns the input list).
 */
export function appendAudit(entry: OrchestratorAuditEntry): OrchestratorAuditEntry[] {
  const next = [entry, ...readAudit()].slice(0, AUDIT_MAX);
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full / unavailable — keep in-memory only */
    }
  }
  return next;
}

/** Clear the audit log. */
export function clearAudit(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
