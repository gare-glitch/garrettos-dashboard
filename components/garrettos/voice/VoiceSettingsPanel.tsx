'use client';

import { useEffect, useState } from 'react';
import { GlassPanel, SectionHeaderCompact, StatusChip, StaggerReveal, StaggerItem } from '@/components/garrettos';
import { GarrettIcon } from '@/components/garrettos/GarrettIcon';
import { ScrollReveal } from '@/components/garrettos/ScrollReveal';
import { typography } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { useVoice } from '../speech/VoiceProvider';
import { VOICE_COMPOSIO_ALLOWED } from '@/lib/garrettos/voice/intent-parser';

function detectHotkeyLabel(): string {
  if (typeof navigator === 'undefined') return '⌘ / Ctrl + Shift + Space';
  const platform = (navigator.platform || '').toLowerCase();
  const ua = (navigator.userAgent || '').toLowerCase();
  return platform.includes('mac') || ua.includes('mac') ? '⌘ + Shift + Space' : 'Ctrl + Shift + Space';
}

/**
 * VoiceSettingsPanel — a Settings card summarizing the voice command layer:
 * browser support, hotkey, Composio voice actions, safety mode, and the future
 * ElevenLabs/Whisper upgrade path. Read-only — no toggles mutate state yet.
 */
export function VoiceSettingsPanel() {
  const { supported } = useVoice();
  const [hotkey, setHotkey] = useState('⌘ / Ctrl + Shift + Space');

  useEffect(() => {
    setHotkey(detectHotkeyLabel());
  }, []);

  const rows: { label: string; value: string; tone: 'good' | 'warn' | 'bad' | 'idle' | 'info'; note?: string }[] = [
    {
      label: 'Voice command status',
      value: supported ? 'Ready' : 'Unavailable',
      tone: supported ? 'good' : 'warn',
      note: supported
        ? 'Web Speech API detected — speak to command GarrettOS.'
        : 'This browser has no SpeechRecognition — use the typed fallback.',
    },
    {
      label: 'Browser speech support',
      value: supported ? 'Web Speech API' : 'Not detected',
      tone: supported ? 'good' : 'bad',
    },
    {
      label: 'Global hotkey',
      value: hotkey,
      tone: 'info',
      note: 'Opens the voice overlay and starts listening.',
    },
    {
      label: 'Composio voice actions',
      value: 'Available',
      tone: 'good',
      note: `Speakable toolkits: ${[...VOICE_COMPOSIO_ALLOWED].join(', ')}. External actions become queued tasks.`,
    },
    {
      label: 'Safety mode',
      value: 'Enabled',
      tone: 'good',
      note: 'Mutating actions require approval. Voice never executes directly.',
    },
    {
      label: 'ElevenLabs voice (TTS)',
      value: 'Future',
      tone: 'idle',
      note: 'Spoken responses via ElevenLabs — not wired in v1.',
    },
    {
      label: 'Whisper transcription',
      value: 'Future',
      tone: 'idle',
      note: 'Higher-accuracy transcription via OpenAI Whisper — not wired in v1.',
    },
  ];

  return (
    <ScrollReveal>
      <GlassPanel variant="card" className="p-4 md:p-5">
        <SectionHeaderCompact
          title="Voice command"
          meta={<StatusChip label="M13 · v1" tone="info" size="inline" />}
        />
        <p className={cn(typography.body, 'mt-2 max-w-2xl')}>
          Siri/Raycast-style voice control. Press the hotkey, speak naturally, and GarrettOS proposes a safe
          navigation or queued task — never a direct mutation.
        </p>
        <StaggerReveal className="mt-3 grid gap-2 md:grid-cols-2">
          {rows.map((row) => (
            <StaggerItem key={row.label}>
              <div className="flex items-start gap-3 rounded-xl border border-white/5 px-3 py-2.5 text-body-sm">
                <span
                  className={cn(
                    'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full',
                    row.tone === 'good'
                      ? 'bg-secondary/15 text-secondary'
                      : row.tone === 'bad'
                        ? 'bg-error/15 text-error'
                        : row.tone === 'warn'
                          ? 'bg-primary/15 text-primary'
                          : row.tone === 'info'
                            ? 'bg-tertiary/15 text-tertiary'
                            : 'bg-white/5 text-outline',
                  )}
                  aria-hidden
                >
                  <GarrettIcon
                    name={row.tone === 'good' ? 'check' : row.tone === 'bad' ? 'close' : row.tone === 'idle' ? 'more_horiz' : 'tune'}
                    size={12}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-on-surface-variant">{row.label}</span>
                    <StatusChip label={row.value} tone={row.tone} size="inline" />
                  </div>
                  {row.note ? <p className="mt-1 text-[11px] text-on-surface-variant">{row.note}</p> : null}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </GlassPanel>
    </ScrollReveal>
  );
}
