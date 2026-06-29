'use client';

import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon } from '../GarrettIcon';
import { useOrchestrator } from './OrchestratorProvider';
import type { OrchestratorStatus } from '@/lib/garrettos/orchestrator/types';

const STATUS_TONE: Record<OrchestratorStatus, string> = {
  completed: 'text-secondary',
  queued: 'text-secondary',
  needs_approval: 'text-primary',
  failed: 'text-error',
  unsupported: 'text-outline',
};

/**
 * OrchestratorAuditPanel — developer-only diagnostics showing the last 10
 * orchestrator requests/results (from localStorage). No secrets: only
 * transcript, intent type, status, target, and task id. Mounted on Settings.
 */
export function OrchestratorAuditPanel({ className }: { className?: string }) {
  const { audit, clearAudit } = useOrchestrator();

  return (
    <div
      className={cn('rounded-xl border border-white/8 bg-surface-container-low/40 p-4', className)}
      aria-label="Orchestrator audit log"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GarrettIcon name="receipt_long" size={18} className="text-primary" />
          <h3 className={cn(typography.headline, 'text-on-surface')}>Orchestrator audit</h3>
        </div>
        <button
          type="button"
          onClick={clearAudit}
          className="rounded-md border border-white/8 px-2 py-1 font-mono text-[10px] text-outline transition-colors hover:bg-white/5 hover:text-on-surface-variant"
        >
          clear
        </button>
      </div>
      <p className={cn(typography.body, 'mt-1 text-[11px] text-on-surface-variant')}>
        Last {audit.length} request{audit.length === 1 ? '' : 's'} (client-side, no secrets).
      </p>

      <div className="mt-3 space-y-1.5">
        {audit.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/8 px-3 py-4 text-center font-mono text-[11px] text-outline">
            No orchestrator requests yet. Try a voice command or a palette command.
          </p>
        ) : (
          audit.map((entry) => (
            <div
              key={entry.auditId}
              className="rounded-lg border border-white/5 bg-surface-container/30 px-3 py-2 font-mono text-[10px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-on-surface-variant">{entry.source}</span>
                <span className={cn('uppercase', STATUS_TONE[entry.status])}>{entry.status}</span>
              </div>
              <p className="mt-1 truncate text-on-surface">&ldquo;{entry.transcript || '—'}&rdquo;</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-outline">
                <span>intent: {entry.intentType}</span>
                {entry.target ? <span>target: {entry.target}</span> : null}
                <span>approval: {entry.requiresApproval ? 'yes' : 'no'}</span>
                {entry.taskId ? <span className="text-secondary">task: {entry.taskId}</span> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
