'use client';

import { useMemo, useState } from 'react';
import {
  AnimatedCounter,
  EmptyState,
  GlassPanel,
  MemoryTimeline,
  MetricCard,
  ScrollReveal,
  SectionHeader,
  SectionHeaderCompact,
  StaggerItem,
  StaggerReveal,
  StatusChip,
} from '@/components/garrettos';
import { GarrettIcon } from '@/components/garrettos/GarrettIcon';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import {
  osMemoryActiveProjects,
  osMemoryDecisions,
  osMemoryStats,
  osMemoryTodos,
  osNeuralIndex,
} from '@/data/os-mock';
import { useGarrettOSData } from '@/lib/garrettos/use-garrettos-data';
import type { MemoryPayload } from '@/lib/garrettos/types';

export default function MemoryPage() {
  // Provider-backed memory payload (falls back to mock on any failure).
  const { data: memoryData, source: memorySource, warning: memoryWarning } = useGarrettOSData<MemoryPayload>(
    '/api/garrettos/memory',
    () => ({
      stats: osMemoryStats,
      events: osNeuralIndex.map((n) => ({ id: n.id, title: n.title, source: n.source, timestamp: n.timestamp, tags: n.tags, chunks: n.chunks, relevance: n.relevance })),
      decisions: osMemoryDecisions,
      todos: osMemoryTodos,
      activeProjects: osMemoryActiveProjects,
    }),
  );

  const stats = memoryData?.stats ?? osMemoryStats;
  const events = memoryData?.events ?? osNeuralIndex;
  const decisions = memoryData?.decisions ?? osMemoryDecisions;
  const todos = memoryData?.todos ?? osMemoryTodos;
  const activeProjects = memoryData?.activeProjects ?? osMemoryActiveProjects;

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(events[0]?.id ?? '');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return events;
    return events.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        (row.tags ?? []).some((t) => t.includes(q)) ||
        row.source.toLowerCase().includes(q),
    );
  }, [query, events]);

  const selected = events.find((row) => row.id === selectedId) ?? events[0];

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        eyebrow="Memory"
        title="Neural Index"
        description="Obsidian + OpenClawMemory workspace. Indexed chunks, decisions, todos, and active projects."
        action={
          <span className="flex items-center gap-2">
            <StatusChip
              label={memorySource === 'server' ? 'Live' : memorySource === 'stale' ? 'Stale' : 'Mock'}
              tone={memorySource === 'server' ? 'good' : memorySource === 'stale' ? 'warn' : 'info'}
              showPip
              size="inline"
            />
            <StatusChip label={`${stats.totalChunks} chunks`} tone="info" showPip />
          </span>
        }
      />

      {memoryWarning ? (
        <p className={cn(typography.body, 'text-[11px] text-primary/80')}>{memoryWarning}</p>
      ) : null}

      <StaggerReveal className="grid grid-cols-2 gap-gutter md:grid-cols-4">
        <StaggerItem>
          <MetricCard
            variant="compact"
            label="Indexed chunks"
            value={<AnimatedCounter value={stats.totalChunks} />}
            delta={`+${stats.newToday} today`}
            tone="info"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            variant="compact"
            label="Sources"
            value={<AnimatedCounter value={stats.sources} />}
            footer="Obsidian, OpenClawMemory"
            tone="good"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            variant="compact"
            label="Decisions"
            value={<AnimatedCounter value={stats.decisions} />}
            tone="info"
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            variant="compact"
            label="Last sync"
            value={stats.lastSync}
            tone="good"
          />
        </StaggerItem>
      </StaggerReveal>

      <ScrollReveal>
        <GlassPanel variant="card" className="p-4">
          <SectionHeaderCompact title="Search memory" />
          <div className="relative mt-3">
            <GarrettIcon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes, chunks, decisions, todos…"
              aria-label="Search memory"
              className={cn(
                'w-full rounded-xl border border-white/10 bg-surface-container-lowest/80 py-2.5 pl-10 pr-4',
                typography.bodySm,
                'text-on-surface placeholder:text-outline/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30',
              )}
            />
          </div>
        </GlassPanel>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        {/* Neural index table */}
        <ScrollReveal className="lg:col-span-7">
          <SectionHeaderCompact
            title="Neural index"
            meta={<StatusChip label={`${filtered.length} results`} tone="info" size="inline" />}
          />
          <GlassPanel variant="card" className="mt-2 overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState
                icon="search"
                title="No matching chunks"
                description="Try a different tag, source, or title."
                compact
              />
            ) : (
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-white/8 text-left">
                    <th className="px-4 py-3 label-caps text-outline">Title</th>
                    <th className="px-3 py-3 label-caps text-outline">Tags</th>
                    <th className="px-3 py-3 label-caps text-outline">Chunks</th>
                    <th className="px-4 py-3 label-caps text-outline text-right">Relevance</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const isActive = row.id === selected?.id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        className={cn(
                          'cursor-pointer border-b border-white/5 last:border-0 transition-colors',
                          isActive ? 'bg-primary/8' : 'hover:bg-white/[0.02]',
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-on-surface">{row.title}</p>
                          <p className="text-[10px] text-outline">{row.source} • {row.timestamp}</p>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(row.tags ?? []).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-white/8 bg-surface-container/40 px-2 py-0.5 font-mono text-[10px] text-on-surface-variant"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 tabular-nums text-on-surface-variant">{row.chunks ?? '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-primary">{row.relevance != null ? `${row.relevance}%` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </GlassPanel>
        </ScrollReveal>

        {/* Detail preview */}
        <ScrollReveal delay={0.05} className="lg:col-span-5">
          <SectionHeaderCompact title="Detail preview" />
          <GlassPanel variant="card" className="mt-2 space-y-4 p-4 md:p-5">
            {selected ? (
              <>
                <div>
                  <p className={typography.labelCaps}>{selected.source}</p>
                  <h3 className={cn(typography.headlineMd, 'mt-1')}>{selected.title}</h3>
                  <p className="text-[11px] text-outline">{selected.timestamp} • {selected.chunks ?? '—'} chunks • {selected.relevance != null ? `${selected.relevance}%` : '—'} relevant</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(selected.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="rounded-lg border border-white/5 bg-surface-container/30 p-3">
                  <p className={typography.body}>
                    Preview not available in mock data. Phase 2 will surface the chunk text, embeddings,
                    and source document links here.
                  </p>
                </div>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-container-high/40 py-2.5 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  <GarrettIcon name="open_in_new" size={16} />
                  Open in source
                </button>
              </>
            ) : (
              <EmptyState icon="psychology" title="No chunk selected" description="Select a row to preview." />
            )}
          </GlassPanel>
        </ScrollReveal>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <ScrollReveal>
          <SectionHeaderCompact title="Memory timeline" />
          <MemoryTimeline entries={events} limit={5} className="mt-2" />
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <SectionHeaderCompact title="Decisions" />
          <GlassPanel variant="card" className="mt-2 p-4">
            <StaggerReveal className="space-y-3">
              {decisions.map((d) => (
                <StaggerItem key={d.id}>
                  <div className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <p className={cn(typography.bodyLg, 'font-medium')}>{d.title}</p>
                    <p className="text-[11px] text-outline">Decided {d.decided}</p>
                    <p className={cn(typography.body, 'mt-1')}>{d.rationale}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </GlassPanel>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <SectionHeaderCompact title="Todos" />
          <GlassPanel variant="card" className="mt-2 p-4">
            <StaggerReveal className="space-y-2">
              {todos.map((todo) => (
                <StaggerItem key={todo.id}>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-surface-container/30 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className={cn(typography.bodySm, 'font-medium')}>{todo.title}</p>
                      <p className="text-[10px] text-outline">Due {todo.due}</p>
                    </div>
                    <StatusChip
                      label={todo.priority}
                      tone={todo.priority === 'high' ? 'warn' : todo.priority === 'medium' ? 'info' : 'idle'}
                      size="inline"
                    />
                  </div>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </GlassPanel>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <SectionHeaderCompact title="Active projects" />
        <StaggerReveal className="mt-2 grid gap-gutter md:grid-cols-3">
          {activeProjects.map((p) => (
            <StaggerItem key={p.id}>
              <GlassPanel variant="card" interactive className="p-4">
                <p className={cn(typography.bodyLg, 'font-semibold')}>{p.title}</p>
                <p className="text-[11px] text-outline">{p.chunks} chunks • updated {p.updated}</p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, p.chunks * 1.5)}%` }} />
                </div>
              </GlassPanel>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </ScrollReveal>
    </div>
  );
}
