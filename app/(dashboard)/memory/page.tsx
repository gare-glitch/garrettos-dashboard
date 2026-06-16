import { Card } from '@/components/Card';
import { notes } from '@/data/mock';

export default function MemoryPage() {
  return <div className="page-stack"><div><p className="eyebrow">Memory</p><h1>Obsidian and OpenClawMemory viewer</h1></div><section className="dashboard-grid"><Card title="Search memory" className="span-12"><input placeholder="Search notes, chunks, decisions, todos" />{notes.map((note) => <div className="row" key={note.title}><span>{note.title}<small>{note.source}</small></span><b>{note.tags.join(', ')}</b></div>)}</Card></section></div>;
}
