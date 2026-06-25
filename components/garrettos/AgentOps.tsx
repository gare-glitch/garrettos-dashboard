'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { springs } from '@/lib/motion';
import { GarrettIcon } from './GarrettIcon';
import { GlassPanel } from './GlassPanel';
import { StaggerItem, StaggerReveal } from './ScrollReveal';
import { StatusChip } from './StatusChip';

export type Approval = {
  id: string;
  action: string;
  agent: string;
  risk: 'low' | 'medium' | 'high';
  detail?: string;
};

const riskTone = {
  low: 'good',
  medium: 'warn',
  high: 'bad',
} as const;

const riskIcon = {
  low: 'check',
  medium: 'warning',
  high: 'dangerous',
} as const;

export function ApprovalDialog({
  approval,
  open,
  onClose,
  onApprove,
  onDeny,
}: {
  approval: Approval | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && approval ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Action approval"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={reduceMotion ? { duration: 0 } : springs.palette}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <GlassPanel variant="panel" className="overflow-hidden p-0">
              <div className="border-b border-white/8 px-5 py-4">
                <p className={typography.labelCaps}>Action approval</p>
                <h2 className={cn(typography.headlineMd, 'mt-1')}>{approval.action}</h2>
              </div>
              <StaggerReveal className="space-y-4 p-5">
                <StaggerItem>
                  <div className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 px-3 py-2.5">
                    <span className="text-body-sm text-on-surface-variant">Agent</span>
                    <span className="font-mono text-body-sm text-on-surface">{approval.agent}</span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container/30 px-3 py-2.5">
                    <span className="text-body-sm text-on-surface-variant">Risk</span>
                    <StatusChip label={approval.risk} tone={riskTone[approval.risk]} showPip size="inline" />
                  </div>
                </StaggerItem>
                {approval.detail ? (
                  <StaggerItem>
                    <div className="rounded-lg border border-white/5 bg-surface-container-low/40 p-3">
                      <p className={typography.labelCaps}>Detail</p>
                      <p className={cn(typography.body, 'mt-1')}>{approval.detail}</p>
                    </div>
                  </StaggerItem>
                ) : null}
                <StaggerItem>
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                    <GarrettIcon name={riskIcon[approval.risk]} size={18} className="text-primary" />
                    <p className={typography.body}>
                      Mock only — no action will execute until Phase 2 VPS bridge is wired.
                    </p>
                  </div>
                </StaggerItem>
              </StaggerReveal>
              <div className="flex gap-3 border-t border-white/8 px-5 py-4">
                <button
                  type="button"
                  onClick={() => onDeny(approval.id)}
                  className="flex-1 rounded-xl border border-error/30 px-4 py-2.5 text-body-sm font-medium text-error transition-colors hover:bg-error/10"
                >
                  Deny
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(approval.id)}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-body-sm font-semibold text-on-primary transition-transform hover:scale-[1.02] active:scale-95"
                >
                  Approve
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export type AgentFleetRow = {
  id: string;
  name: string;
  model: string;
  status: 'active' | 'idle' | 'error';
  latency: string;
  uptime: string;
  throughput?: string;
  sparkPath?: string;
};

export function AgentFleetTable({ rows, onConfigure }: { rows: AgentFleetRow[]; onConfigure?: (id: string) => void }) {
  return (
    <GlassPanel variant="card" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-white/8 text-left bg-surface-container-highest/30">
              <th className="px-4 py-3 label-caps text-outline">Status</th>
              <th className="px-3 py-3 label-caps text-outline">Agent</th>
              <th className="px-3 py-3 label-caps text-outline">Model</th>
              <th className="px-3 py-3 label-caps text-outline">Latency</th>
              <th className="px-3 py-3 label-caps text-outline">Uptime</th>
              <th className="px-4 py-3 label-caps text-outline text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-surface-container/40">
                <td className="px-4 py-3">
                  <StatusChip
                    label={row.status}
                    tone={row.status === 'active' ? 'good' : row.status === 'error' ? 'bad' : 'idle'}
                    showPip
                    size="inline"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <GarrettIcon name="robot_2" size={18} className="text-primary" />
                    <span className="font-medium">{row.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-on-surface-variant">{row.model}</td>
                <td className="px-3 py-3 font-mono text-on-surface-variant">{row.latency}</td>
                <td className="px-3 py-3 font-mono text-on-surface-variant">{row.uptime}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onConfigure?.(row.id)}
                    className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary"
                    aria-label={`Configure ${row.name}`}
                  >
                    <GarrettIcon name="settings" size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}

export type AgentConfig = {
  model: string;
  systemPrompt: string;
  temperature: number;
};

export function AgentDrawer({
  open,
  onClose,
  agentName,
  config,
  onConfigChange,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  agentName: string;
  config: AgentConfig;
  onConfigChange: (config: AgentConfig) => void;
  onSave: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close agent config"
          />
          <motion.aside
            initial={reduceMotion ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={reduceMotion ? { duration: 0 } : springs.soft}
            className="fixed right-0 top-0 z-[70] flex h-dvh w-full max-w-md flex-col border-l border-white/8 bg-surface-container-low backdrop-blur-2xl"
            aria-label={`Configure ${agentName}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <p className={typography.labelCaps}>Agent configuration</p>
                <h2 className={cn(typography.headlineMd, 'mt-0.5')}>{agentName}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-outline hover:bg-white/5 hover:text-on-surface"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <StaggerReveal className="flex-1 space-y-5 overflow-y-auto scroll-hide p-5">
              <StaggerItem>
                <label className={typography.labelCaps} htmlFor="agent-model">Model</label>
                <select
                  id="agent-model"
                  value={config.model}
                  onChange={(e) => onConfigChange({ ...config, model: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-surface-container-lowest/80 px-4 py-2.5 text-body-sm text-on-surface focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="claude-sonnet">claude-sonnet</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="llama3.1:8b">llama3.1:8b</option>
                  <option value="o1-mini">o1-mini</option>
                </select>
              </StaggerItem>
              <StaggerItem>
                <label className={typography.labelCaps} htmlFor="agent-prompt">System prompt</label>
                <textarea
                  id="agent-prompt"
                  rows={6}
                  value={config.systemPrompt}
                  onChange={(e) => onConfigChange({ ...config, systemPrompt: e.target.value })}
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-surface-container-lowest/80 px-4 py-2.5 text-body-sm text-on-surface placeholder:text-outline/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="You are a careful autonomous agent…"
                />
              </StaggerItem>
              <StaggerItem>
                <div className="flex items-center justify-between">
                  <label className={typography.labelCaps} htmlFor="agent-temp">Temperature</label>
                  <span className="font-mono text-body-sm text-primary">{config.temperature.toFixed(2)}</span>
                </div>
                <input
                  id="agent-temp"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.temperature}
                  onChange={(e) => onConfigChange({ ...config, temperature: parseFloat(e.target.value) })}
                  className="mt-3 w-full accent-primary"
                />
              </StaggerItem>
            </StaggerReveal>
            <div className="flex gap-3 border-t border-white/8 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-body-sm font-semibold text-on-primary transition-transform hover:scale-[1.02] active:scale-95"
              >
                Save
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
