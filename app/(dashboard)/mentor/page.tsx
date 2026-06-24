import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { DashboardGrid } from '@/components/layout-grid';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function MentorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Mentor"
        title="Daily advice without browser AI keys"
        description="Phase 1 is UI-only. Phase 2 calls server routes that choose Anthropic, local, or OpenClaw providers."
      />
      <DashboardGrid>
        <Card title="Mentor prompt" className="md:col-span-8">
          <Textarea rows={8} placeholder="Ask for advice using dashboard context..." />
          <Button className="mt-4 w-full sm:w-auto">Send via server provider</Button>
        </Card>
        <Card title="Readable context" className="md:col-span-4">
          <ul className="grid gap-2">
            {['Health summaries', 'Gym progression', 'Water and supplements', 'Projects and revenue', 'OpenClaw agent status'].map(
              (item) => (
                <li
                  key={item}
                  className="rounded-xl border border-border bg-input/50 px-3 py-2 text-sm text-muted-foreground"
                >
                  {item}
                </li>
              ),
            )}
          </ul>
        </Card>
      </DashboardGrid>
    </div>
  );
}
