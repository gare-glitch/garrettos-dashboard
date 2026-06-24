import {
  AgentGraph,
  GlassPanel,
  SectionHeader,
  SectionHeaderCompact,
  StatusChip,
  TaskQueue,
} from '@/components/garrettos';
import { spacing } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { osAgents, osApprovals, osTasks } from '@/data/os-mock';
import { agentRuns } from '@/data/mock';

export default function OpenClawPage() {
  return (
    <div className={spacing.page}>
      <SectionHeader eyebrow="OpenClaw Control" title="Agent orchestration and approvals" />

      <div className="os-bento">
        <div className="col-span-2 md:col-span-8">
          <SectionHeaderCompact title="Agent graph" />
          <AgentGraph nodes={osAgents.nodes} edges={osAgents.edges} className="mt-2" />
        </div>
        <div className="col-span-2 md:col-span-4">
          <SectionHeaderCompact title="Guardrails" />
          <GlassPanel className="mt-2 p-4">
            <p className="text-xs text-muted-foreground">
              Privileged actions require approval records before Phase 2 VPS execution is enabled.
            </p>
          </GlassPanel>
        </div>
      </div>

      <div className="os-bento">
        <div className="col-span-2 md:col-span-6">
          <SectionHeaderCompact title="Task queue" />
          <TaskQueue tasks={osTasks} className="mt-2" />
        </div>
        <div className="col-span-2 md:col-span-6">
          <SectionHeaderCompact title="Pending approvals" />
          <GlassPanel className="mt-2 p-3">
            <ul className="space-y-0">
              {osApprovals.map((a, i) => (
                <li key={a.id} className={`flex items-center justify-between py-2 ${i > 0 ? 'border-t border-border/60' : ''}`}>
                  <div>
                    <p className="text-xs font-medium">{a.action}</p>
                    <p className="text-[10px] text-muted-foreground">{a.agent}</p>
                  </div>
                  <StatusChip label={a.risk} tone={a.risk === 'high' ? 'bad' : a.risk === 'medium' ? 'warn' : 'good'} />
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>
      </div>

      <GlassPanel className="p-4">
        <SectionHeaderCompact title="Legacy run queue" meta={<StatusChip label={`${agentRuns.length}`} tone="info" />} />
        <ul className="mt-2 grid gap-2 md:grid-cols-3">
          {agentRuns.map((run) => (
            <li key={run.title} className="rounded-xl border border-border bg-input/20 px-3 py-2">
              <p className="text-xs font-medium">{run.title}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{run.approval}</p>
              <StatusChip label={run.status} tone={run.status === 'blocked' ? 'bad' : 'warn'} className="mt-2" />
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Button size="sm">Start</Button>
          <Button size="sm" variant="secondary">Review</Button>
          <Button size="sm" variant="outline">Send back</Button>
          <Button size="sm">Approve</Button>
        </div>
      </GlassPanel>
    </div>
  );
}
