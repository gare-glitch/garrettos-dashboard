import { Card } from '@/components/Card';
import { DataRow } from '@/components/DataRow';
import { PageHeader } from '@/components/PageHeader';
import { DashboardGrid } from '@/components/layout-grid';
import { Input } from '@/components/ui/input';
import { notes } from '@/data/mock';

export default function MemoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Memory" title="Obsidian and OpenClawMemory viewer" />
      <DashboardGrid>
        <Card title="Search memory" className="md:col-span-12">
          <Input placeholder="Search notes, chunks, decisions, todos" />
          <div className="mt-4">
            {notes.map((note) => (
              <DataRow key={note.title} label={note.title} value={note.tags.join(', ')} hint={note.source} />
            ))}
          </div>
        </Card>
      </DashboardGrid>
    </div>
  );
}
