'use client';

import { useState } from 'react';
import {
  ApiKeyCard,
  ApiKeyGroup,
  SecurityAlert,
} from '@/components/garrettos/ApiKeyCard';
import {
  GlassPanel,
  SectionHeader,
  SectionHeaderCompact,
  SettingsShell,
  StaggerItem,
  StaggerReveal,
  StatusChip,
} from '@/components/garrettos';
import { GarrettIcon } from '@/components/garrettos/GarrettIcon';
import { ScrollReveal } from '@/components/garrettos/ScrollReveal';
import { typography } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import {
  getIntegrationStatus,
  integrationGroups,
  liveDataEnvs,
  settingsChecklist,
  settingsNavItems,
  settingsSecurityAlert,
} from '@/data/integrations-mock';
import { ComposioStatusCard } from '@/components/garrettos/agent-ops/ComposioStatusCard';
import { VoiceSettingsPanel } from '@/components/garrettos/voice';

const sectionTitles: Record<string, string> = {
  general: 'General',
  security: 'Security',
  'api-keys': 'API Keys',
  integrations: 'Integrations',
  appearance: 'Appearance',
};

export default function SettingsPage() {
  const [active, setActive] = useState('integrations');

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="System"
        title="Integration Status Center"
        description="Control center for what is connected, what is mocked, and what needs setup next."
        action={
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-body-sm font-semibold text-on-primary transition-transform hover:scale-[1.02] active:scale-95"
          >
            <GarrettIcon name="add" size={18} />
            Create new key
          </button>
        }
      />

      <SettingsShell navItems={settingsNavItems} activeId={active} onChange={setActive}>
        <div className="space-y-6">
          <ScrollReveal>
            <div className="flex items-baseline justify-between">
              <h2 className={typography.headline}>{sectionTitles[active] ?? 'Settings'}</h2>
            </div>
          </ScrollReveal>

          {active === 'general' ? <GeneralSection /> : null}
          {active === 'security' ? <SecuritySection /> : null}
          {active === 'api-keys' ? <ApiKeysSection /> : null}
          {active === 'integrations' ? <IntegrationsSection /> : null}
          {active === 'appearance' ? <AppearanceSection /> : null}
        </div>
      </SettingsShell>
    </div>
  );
}

function GeneralSection() {
  return (
    <div className="space-y-6">
      <ScrollReveal>
        <GlassPanel variant="card" className="p-4 md:p-5">
          <SectionHeaderCompact
            title="Onboarding checklist"
            meta={
              <StatusChip
                label={`${settingsChecklist.filter((c) => c.done).length}/${settingsChecklist.length}`}
                tone="info"
                size="inline"
              />
            }
          />
          <StaggerReveal className="mt-3 grid gap-2 md:grid-cols-2">
            {settingsChecklist.map((item) => (
              <StaggerItem key={item.label}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-xl border border-white/5 px-3 py-2.5 text-body-sm',
                    item.done ? 'text-on-surface' : 'text-on-surface-variant',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-full',
                      item.done ? 'bg-secondary/15 text-secondary' : 'bg-white/5 text-outline',
                    )}
                  >
                    {item.done ? <GarrettIcon name="check" size={12} /> : <GarrettIcon name="more_horiz" size={12} />}
                  </span>
                  {item.label}
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </GlassPanel>
      </ScrollReveal>

      <LiveDataReadinessCard />
    </div>
  );
}

function LiveDataReadinessCard() {
  const mode = process.env.NEXT_PUBLIC_GARRETTOS_DATA_MODE ?? 'mock';
  return (
    <ScrollReveal delay={0.05}>
      <GlassPanel variant="card" className="p-4 md:p-5">
        <SectionHeaderCompact
          title="Live data readiness"
          meta={
            <StatusChip
              label={`mode: ${mode}`}
              tone={mode === 'server' ? 'good' : 'info'}
              size="inline"
              showPip
            />
          }
        />
        <p className={cn(typography.body, 'mt-2 max-w-2xl')}>
          Optional bridge envs that switch GarrettOS panels from mock to live data.
          All are safe to leave unset — every panel falls back to mock data.
        </p>
        <StaggerReveal className="mt-3 grid gap-2 md:grid-cols-2">
          {liveDataEnvs.map((env) => {
            const set = Boolean(process.env[`NEXT_PUBLIC_${env.env}`]) || Boolean(process.env[env.env]);
            return (
              <StaggerItem key={env.env}>
                <div
                  className={cn(
                    'flex items-start gap-3 rounded-xl border border-white/5 px-3 py-2.5',
                    set ? 'text-on-surface' : 'text-on-surface-variant',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full',
                      set ? 'bg-secondary/15 text-secondary' : 'bg-white/5 text-outline',
                    )}
                    aria-hidden
                  >
                    {set ? <GarrettIcon name="check" size={12} /> : <GarrettIcon name="more_horiz" size={12} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium">
                      {env.label}
                      <span className="ml-2 font-mono text-[10px] text-outline">{env.env}</span>
                    </p>
                    <p className="text-[11px] text-on-surface-variant">{env.description}</p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerReveal>
      </GlassPanel>
    </ScrollReveal>
  );
}

function SecuritySection() {
  return (
    <div className="space-y-4">
      <ScrollReveal>
        <SecurityAlert
          title={settingsSecurityAlert.title}
          message={settingsSecurityAlert.message}
        />
      </ScrollReveal>
      <ScrollReveal delay={0.05}>
        <GlassPanel variant="card" className="p-4 md:p-5">
          <SectionHeaderCompact title="Authentication" />
          <ul className="mt-3 space-y-3 text-body-sm">
            <li className="flex items-center justify-between">
              <span className="text-on-surface-variant">Supabase magic link</span>
              <StatusChip label="Enabled" tone="good" showPip size="inline" />
            </li>
            <li className="flex items-center justify-between">
              <span className="text-on-surface-variant">Auth bypass (dev)</span>
              <StatusChip
                label={process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true' ? 'On' : 'Off'}
                tone={process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true' ? 'warn' : 'idle'}
                size="inline"
              />
            </li>
            <li className="flex items-center justify-between">
              <span className="text-on-surface-variant">Redirect URLs configured</span>
              <StatusChip label="Pending" tone="warn" size="inline" />
            </li>
          </ul>
        </GlassPanel>
      </ScrollReveal>
    </div>
  );
}

function ApiKeysSection() {
  return (
    <div className="space-y-8">
      {integrationGroups.map((group) => (
        <ApiKeyGroup
          key={group.id}
          title={group.title}
          icon={group.icon}
          items={group.integrations.map((integration) => {
            const { status, tone } = getIntegrationStatus(integration);
            return {
              name: integration.name,
              maskedKey: integration.apiKey ?? integration.env.join(', '),
              lastUsed: integration.lastUsed,
              status,
              tone,
              env: integration.env,
              nextStep: integration.nextStep,
            };
          })}
        />
      ))}
    </div>
  );
}

function IntegrationsSection() {
  return (
    <div className="space-y-6">
      <ComposioStatusCard />
      <VoiceSettingsPanel />

      <ScrollReveal>
        <GlassPanel variant="card" className="p-4 md:p-5">
          <SectionHeaderCompact
            title="Onboarding checklist"
            meta={
              <StatusChip
                label={`${settingsChecklist.filter((c) => c.done).length}/${settingsChecklist.length}`}
                tone="info"
                size="inline"
              />
            }
          />
          <StaggerReveal className="mt-3 grid gap-2 md:grid-cols-2">
            {settingsChecklist.map((item) => (
              <StaggerItem key={item.label}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-xl border border-white/5 px-3 py-2.5 text-body-sm',
                    item.done ? 'text-on-surface' : 'text-on-surface-variant',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-full',
                      item.done ? 'bg-secondary/15 text-secondary' : 'bg-white/5 text-outline',
                    )}
                  >
                    {item.done ? <GarrettIcon name="check" size={12} /> : <GarrettIcon name="more_horiz" size={12} />}
                  </span>
                  {item.label}
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </GlassPanel>
      </ScrollReveal>

      {integrationGroups.map((group) => (
        <ScrollReveal key={group.id}>
          <div className="mb-3 flex items-center gap-3">
            <GarrettIcon name={group.icon} size={22} className="text-primary" />
            <h3 className={typography.headlineMd}>{group.title}</h3>
          </div>
          <StaggerReveal className="grid gap-gutter md:grid-cols-2">
            {group.integrations.map((integration) => {
              const { status, tone } = getIntegrationStatus(integration);
              return (
                <StaggerItem key={integration.name}>
                  <ApiKeyCard
                    name={integration.name}
                    maskedKey={integration.apiKey ?? integration.env.join(', ')}
                    lastUsed={integration.lastUsed}
                    status={status}
                    tone={tone}
                    env={integration.env}
                    nextStep={integration.nextStep}
                  />
                </StaggerItem>
              );
            })}
          </StaggerReveal>
        </ScrollReveal>
      ))}
    </div>
  );
}

function AppearanceSection() {
  return (
    <ScrollReveal>
      <GlassPanel variant="card" className="p-4 md:p-5">
        <SectionHeaderCompact title="Appearance" />
        <ul className="mt-3 space-y-3 text-body-sm">
          <li className="flex items-center justify-between">
            <span className="text-on-surface-variant">Theme</span>
            <span className="font-mono text-on-surface">Stitch sand (dark)</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-on-surface-variant">Font</span>
            <span className="font-mono text-on-surface">Geist / Geist Mono</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-on-surface-variant">Reduced motion</span>
            <StatusChip label="Auto" tone="info" size="inline" />
          </li>
          <li className="flex items-center justify-between">
            <span className="text-on-surface-variant">Glass blur</span>
            <span className="font-mono text-on-surface">24px</span>
          </li>
        </ul>
      </GlassPanel>
    </ScrollReveal>
  );
}
