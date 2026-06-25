'use client';

import { useState } from 'react';
import {
  AssistantPanel,
  GlassPanel,
  ScrollReveal,
  SectionHeader,
  SectionHeaderCompact,
  StaggerItem,
  StaggerReveal,
  StatusChip,
  type AssistantMessage,
} from '@/components/garrettos';
import { GarrettIcon } from '@/components/garrettos/GarrettIcon';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { osModelRoutes } from '@/data/os-mock';

const contextCards = [
  {
    id: 'health',
    label: 'Health',
    icon: 'ecg_heart',
    summary: 'Body Battery 88 • HRV 62ms • Stress low',
    detail: 'Recovery is high. Push day viable.',
    tone: 'good' as const,
  },
  {
    id: 'gym',
    label: 'Gym',
    icon: 'fitness_center',
    summary: 'Bench +5 lb • 3 sessions this week',
    detail: 'On progressive overload track.',
    tone: 'good' as const,
  },
  {
    id: 'memory',
    label: 'Memory',
    icon: 'psychology',
    summary: '248 chunks • 3 active projects',
    detail: 'Lean bulk protocol indexed.',
    tone: 'info' as const,
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: 'analytics',
    summary: '$12.4k MTD • 3 active',
    detail: 'OpenClaw Services leading.',
    tone: 'good' as const,
  },
  {
    id: 'agents',
    label: 'OpenClaw',
    icon: 'smart_toy',
    summary: '3 agents active • 3 approvals',
    detail: 'VPS bridge restart pending.',
    tone: 'warn' as const,
  },
];

const initialMessages: AssistantMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    content: "Good evening. You're recovered well — Body Battery 88, HRV 62ms. I'd suggest the planned Push A session tomorrow at 06:30. OpenClaw has 3 approvals queued; the VPS bridge restart is the priority one. Want me to draft the approval review?",
    time: '7:42 PM',
  },
];

export default function MentorPage() {
  const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages);
  const [provider, setProvider] = useState('claude-sonnet');

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: AssistantMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    // Mock assistant reply
    setTimeout(() => {
      const reply: AssistantMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: 'Mock reply — Phase 2 will route this through the server provider with live context cards. For now, this confirms the mentor workspace is wired and accepting input.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, reply]);
    }, 700);
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader
        eyebrow="AI Mentor"
        title="Daily advice with dashboard context"
        description="Mock provider routing now. Phase 2 calls server routes that choose Anthropic, local, or OpenClaw providers."
        action={
          <div className="flex items-center gap-2 rounded-full border border-white/8 bg-surface-container/40 px-3 py-1.5">
            <GarrettIcon name="route" size={16} className="text-primary" />
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="bg-transparent text-body-sm text-on-surface focus:outline-none"
              aria-label="Model provider"
            >
              <option value="claude-sonnet" className="bg-surface">claude-sonnet</option>
              <option value="gpt-4o" className="bg-surface">gpt-4o</option>
              <option value="llama3.1:8b" className="bg-surface">llama3.1:8b (local)</option>
              <option value="o1-mini" className="bg-surface">o1-mini</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        {/* Assistant panel — takes 2 cols */}
        <ScrollReveal className="lg:col-span-2">
          <AssistantPanel
            messages={messages}
            onSend={send}
            title="Mentor"
            subtitle={`Routing via ${provider}`}
            className="h-[640px]"
          />
        </ScrollReveal>

        {/* Context cards + model routing */}
        <div className="space-y-6">
          <ScrollReveal>
            <SectionHeaderCompact
              title="Context cards"
              meta={<StatusChip label="5 sources" tone="info" size="inline" />}
            />
            <StaggerReveal className="mt-2 space-y-2">
              {contextCards.map((card) => (
                <StaggerItem key={card.id}>
                  <GlassPanel variant="card" interactive className="p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-surface-container-high/40">
                        <GarrettIcon name={card.icon} size={18} className="text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(typography.bodyLg, 'font-semibold')}>{card.label}</p>
                          <StatusChip label="" tone={card.tone} showPip size="inline" />
                        </div>
                        <p className={typography.body}>{card.summary}</p>
                        <p className="mt-0.5 text-[11px] text-outline">{card.detail}</p>
                      </div>
                    </div>
                  </GlassPanel>
                </StaggerItem>
              ))}
            </StaggerReveal>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <SectionHeaderCompact title="Model routing" />
            <GlassPanel variant="card" className="mt-2 p-4">
              <StaggerReveal className="space-y-2">
                {osModelRoutes.slice(0, 4).map((m) => (
                  <StaggerItem key={m.model}>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-surface-container/30 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-mono text-body-sm text-on-surface">{m.model}</p>
                        <p className="text-[10px] text-outline">{m.provider}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-mono text-[11px] text-on-surface-variant">{m.latency}</span>
                        <StatusChip label={m.status} tone={m.status} showPip size="inline" />
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerReveal>
            </GlassPanel>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
