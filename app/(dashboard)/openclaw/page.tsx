import { Card } from '@/components/Card';
import { DataRow } from '@/components/DataRow';
import { PageHeader } from '@/components/PageHeader';
import { DashboardGrid } from '@/components/layout-grid';
import { Button } from '@/components/ui/button';
import { agentRuns } from '@/data/mock';

export default function OpenClawPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="OpenClaw Control" title="Agent run queue and approvals" />
      <DashboardGrid>
        <Card title="Runs" className="md:col-span-8">
          {agentRuns.map((run) => (
            <DataRow key={run.title} label={run.title} value={run.status} hint={run.approval} />
          ))}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button>Start</Button>
            <Button variant="secondary">Review</Button>
            <Button variant="outline">Send back</Button>
            <Button variant="default">Approve</Button>
          </div>
        </Card>
        <Card title="Guardrails" className="md:col-span-4">
          <p className="text-sm text-muted-foreground">
            Privileged actions are modeled as approval records before Phase 2 VPS execution is enabled.
          </p>
        </Card>
      </DashboardGrid>
    </div>
  );
}
