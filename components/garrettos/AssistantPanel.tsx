'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/design-system';
import { osAssistantMessages } from '@/data/os-mock';
import { GarrettIcon } from './GarrettIcon';
import { GlassPanel } from './GlassPanel';
import { CodeLineLoader, ThinkingLoader } from './ThinkingLoader';

export type AssistantMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  time: string;
};

export function AssistantPanel({
  messages = osAssistantMessages,
  generating = false,
  onSend,
  title = 'Assistant.v4',
  subtitle,
  className,
}: {
  messages?: AssistantMessage[];
  generating?: boolean;
  onSend?: (text: string) => void;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState('');

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    onSend?.(text);
    setDraft('');
  }

  return (
    <GlassPanel variant="card" className={cn('flex min-h-[420px] flex-col overflow-hidden', className)}>
      <div className="flex items-center justify-between border-b border-white/5 bg-surface-container/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <GarrettIcon name="auto_awesome" size={18} className="text-primary" />
          <div>
            <span className={cn(typography.bodyLg, 'font-semibold')}>{title}</span>
            {subtitle ? <p className="text-[10px] text-outline">{subtitle}</p> : null}
          </div>
        </div>
        {generating ? <ThinkingLoader label="Thinking" /> : null}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto scroll-hide p-4 md:p-5" role="log" aria-live="polite">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
          >
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg border',
                msg.role === 'assistant'
                  ? 'border-primary/20 bg-primary/10'
                  : 'border-secondary/20 bg-secondary/10',
              )}
            >
              <GarrettIcon
                name={msg.role === 'assistant' ? 'bolt' : 'person'}
                size={18}
                className={msg.role === 'assistant' ? 'text-primary' : 'text-secondary'}
              />
            </div>
            <div className={cn('max-w-[85%] space-y-1', msg.role === 'user' && 'text-right')}>
              <p
                className={cn(
                  'rounded-xl border p-4 text-body-sm',
                  msg.role === 'assistant'
                    ? 'rounded-tl-none border-white/5 bg-surface-container/40 text-on-surface'
                    : 'rounded-tr-none border-primary/20 bg-primary/10 text-on-surface',
                )}
              >
                {msg.content}
              </p>
              <span className="px-1 font-mono text-[10px] text-outline">{msg.time}</span>
            </div>
          </div>
        ))}

        {generating ? (
          <div className="rounded-xl border border-white/5 bg-surface-container/30 p-4">
            <p className={cn(typography.labelCaps, 'mb-3 text-[10px]')}>Generating routing update</p>
            <CodeLineLoader lines={3} />
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/5 p-4">
        <div className="relative">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Instruct Assistant…"
            rows={2}
            className={cn(
              'w-full resize-none rounded-xl border border-white/10 bg-surface-container-lowest/80',
              'px-4 py-3 pr-14 text-body-sm text-on-surface placeholder:text-outline/50',
              'focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30',
            )}
            aria-label="Message assistant"
          />
          <button
            type="button"
            onClick={handleSend}
            className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-lg bg-primary text-on-primary transition-transform hover:scale-105 active:scale-95"
            aria-label="Send message"
          >
            <GarrettIcon name="arrow_upward" size={20} />
          </button>
        </div>
      </div>
    </GlassPanel>
  );
}
