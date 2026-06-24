import { GlassPanel, MemoryTimeline, MetricCard, SectionHeader, SectionHeaderCompact } from '@/components/garrettos';
import { spacing } from '@/lib/design-system';
import { Input } from '@/components/ui/input';
import { notes } from '@/data/mock';
import { osMemory } from '@/data/os-mock';

export default function MemoryPage() {
  return (
    <div className={spacing.page}>
      <SectionHeader eyebrow="Memory" title="Obsidian and OpenClawMemory" description="Indexed chunks, decisions, and knowledge graph." />

      <div className="os-bento">
        <MetricCard label="Indexed chunks" value="248" delta="+12 today" tone="info" className="col-span-1 md:col-span-4" compact />
        <MetricCard label="Sources" value="2" footer="Obsidian, OpenClawMemory" className="col-span-1 md:col-span-4" compact />
        <MetricCard label="Last sync" value="2h" tone="good" className="col-span-1 md:col-span-4" compact />
      </div>

      <GlassPanel className="p-4">
        <SectionHeaderCompact title="Search memory" />
        <Input className="mt-3" placeholder="Search notes, chunks, decisions, todos" />
      </GlassPanel>

      <div className="os-bento">
        <div className="col-span-2 md:col-span-6">
          <SectionHeaderCompact title="Timeline" />
          <MemoryTimeline entries={osMemory} limit={6} className="mt-2" />
        </div>
        <GlassPanel className="col-span-2 p-4 md:col-span-6">
          <SectionHeaderCompact title="Indexed notes" />
          <ul className="mt-2 space-y-0">
            {notes.map((note, i) => (
              <li key={note.title} className={`py-2.5 ${i > 0 ? 'border-t border-border/60' : ''}`}>
                <p className="text-xs font-medium">{note.title}</p>
                <p className="text-[10px] text-muted-foreground">{note.source} • {note.tags.join(', ')}</p>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </div>
    </div>
  );
}
