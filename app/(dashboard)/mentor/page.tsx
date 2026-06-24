import { GlassPanel, SectionHeader, SectionHeaderCompact, StatusChip } from '@/components/garrettos';
import { spacing } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { osModelRoutes } from '@/data/os-mock';

const contextItems = ['Health summaries', 'Gym progression', 'Water and supplements', 'Projects and revenue', 'OpenClaw agent status'];

export default function MentorPage() {
  return (
    <div className={spacing.page}>
      <SectionHeader
        eyebrow="AI Mentor"
        title="Daily advice without browser AI keys"
        description="Phase 1 is UI-only. Phase 2 calls server routes that choose Anthropic, local, or OpenClaw providers."
      />

      <div className="os-bento">
        <GlassPanel className="col-span-2 p-4 md:col-span-8">
          <SectionHeaderCompact title="Mentor prompt" />
          <Textarea className="mt-3" rows={8} placeholder="Ask for advice using dashboard context..." />
          <Button className="mt-3 w-full sm:w-auto">Send via server provider</Button>
        </GlassPanel>
        <div className="col-span-2 space-y-3 md:col-span-4">
          <GlassPanel className="p-4">
            <SectionHeaderCompact title="Readable context" />
            <ul className="mt-2 grid gap-1.5">
              {contextItems.map((item) => (
                <li key={item} className="rounded-lg border border-border bg-input/30 px-2.5 py-1.5 text-xs text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </GlassPanel>
          <GlassPanel className="p-4">
            <SectionHeaderCompact title="Model routing" />
            <ul className="mt-2 space-y-0">
              {osModelRoutes.slice(0, 3).map((m, i) => (
                <li key={m.model} className={`flex items-center justify-between py-2 ${i > 0 ? 'border-t border-border/60' : ''}`}>
                  <span className="text-xs">{m.model}</span>
                  <StatusChip label={m.latency} tone="info" />
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
