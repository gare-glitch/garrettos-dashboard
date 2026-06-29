'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { GarrettIcon } from '../GarrettIcon';
import type { VoiceIntent } from '@/lib/garrettos/voice/voice-types';

const KIND_ICON: Record<VoiceIntent['kind'], string> = {
  navigation: 'route',
  task: 'add_task',
  composio: 'hub',
  unknown: 'help',
};

const KIND_LABEL: Record<VoiceIntent['kind'], string> = {
  navigation: 'Navigation',
  task: 'Task creation',
  composio: 'Composio action',
  unknown: 'Unrecognized',
};

/**
 * VoiceIntentCard — the parsed intent surfaced as a calm, scannable card:
 * kind, label, agent, Composio toolkits, and an approval-required badge when
 * the action mutates state.
 */
export function VoiceIntentCard({ intent, className }: { intent: VoiceIntent; className?: string }) {
  return (
    <motion.div
      className={cn(
        'w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left',
        className,
      )}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
          <GarrettIcon name={KIND_ICON[intent.kind]} size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn(typography.labelCaps, 'text-[9px] text-outline')}>
              {KIND_LABEL[intent.kind]}
            </span>
            <span className="font-mono text-[9px] text-outline/70">{intent.id}</span>
          </div>
          <p className={cn(typography.bodySm, 'mt-0.5 font-medium')}>{intent.label}</p>

          {intent.taskTitle ? (
            <p className="mt-1 text-[12px] text-on-surface-variant line-clamp-2">{intent.taskTitle}</p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {intent.agent ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5 text-[10px] text-on-surface-variant">
                <GarrettIcon name="smart_toy" size={11} />
                {intent.agent}
              </span>
            ) : null}
            {intent.composioTools && intent.composioTools.length > 0 ? (
              intent.composioTools.map((tk) => (
                <span
                  key={tk}
                  className="inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-[10px] text-secondary"
                >
                  <GarrettIcon name="hub" size={11} />
                  {tk}
                </span>
              ))
            ) : null}
            {intent.requiresApproval ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                <GarrettIcon name="gpp_maybe" size={11} />
                Needs approval
              </span>
            ) : intent.kind === 'task' || intent.kind === 'composio' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-secondary/25 bg-secondary/10 px-2 py-0.5 text-[10px] text-secondary">
                <GarrettIcon name="check" size={11} />
                Read-only
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
