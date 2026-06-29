'use client';

import { ScrollReveal } from '@/components/garrettos/ScrollReveal';
import { GlassPanel, SectionHeaderCompact, StatusChip } from '@/components/garrettos';
import { GarrettIcon } from '@/components/garrettos/GarrettIcon';
import { useGarrettOSData } from '@/lib/garrettos/use-garrettos-data';
import { typography } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import type { ComposioStatus, IntegrationsPayload } from '@/lib/garrettos/types';

/**
 * ComposioStatusCard — read-only Composio CLI readiness display for the
 * Settings / OpenClaw pages. Shows installed/auth state, connected apps,
 * available toolkits, and the CLI-vs-MCP mode recommendation.
 *
 * This is DISPLAY ONLY. No button here executes a Composio action — execution
 * happens only inside supervised tmux agent runs launched by the loop daemon.
 */
export function ComposioStatusCard() {
  const { data, source, warning } = useGarrettOSData<IntegrationsPayload>(
    '/api/garrettos/integrations',
    () => ({
      integrations: [],
      stats: { connected: 0, mocked: 0, missingEnv: 0, total: 0 },
      composio: {
        installed: true,
        authenticated: true,
        version: 'composio-core (mock)',
        cliMode: true,
        mcpMode: false,
        connectedAccounts: ['github', 'gmail'],
        toolkits: ['gmail', 'google_calendar', 'github', 'slack', 'notion'],
        status: 'connected',
        tone: 'good',
        note: '2 connected app(s) — mock preview',
      },
    }),
  );
  const composio = data?.composio;

  return (
    <ScrollReveal>
      <GlassPanel variant="card" className="p-4 md:p-5">
        <SectionHeaderCompact
          title="Composio CLI"
          meta={
            <StatusChip
              label={composio ? composio.status : 'loading'}
              tone={(composio?.tone ?? 'info') as 'good' | 'warn' | 'bad' | 'info' | 'idle'}
              size="inline"
              showPip
            />
          }
        />

        {!composio ? (
          <p className={cn(typography.body, 'mt-2 text-[12px] text-on-surface-variant')}>
            {warning ? warning : 'Checking Composio readiness…'}
          </p>
        ) : (
          <ComposioDetails composio={composio} source={source} />
        )}
      </GlassPanel>
    </ScrollReveal>
  );
}

function ComposioDetails({ composio, source }: { composio: ComposioStatus; source: string }) {
  return (
    <div className="mt-3 space-y-3">
      <p className={cn(typography.body, 'text-[12px] text-on-surface-variant')}>{composio.note}</p>

      <ul className="space-y-2 text-body-sm">
        <ReadinessRow label="Installed" ok={composio.installed} detail={composio.version || 'not on PATH'} />
        <ReadinessRow label="Authenticated" ok={composio.authenticated} detail={composio.authenticated ? 'logged in' : 'run `composio login`'} />
      </ul>

      <div>
        <p className={cn(typography.labelCaps, 'mb-1.5 text-[10px] text-on-surface-variant')}>Connected apps</p>
        {composio.connectedAccounts.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {composio.connectedAccounts.map((app) => (
              <span
                key={app}
                className="inline-flex items-center gap-1 rounded-full border border-secondary/25 bg-secondary/10 px-2.5 py-1 text-[11px] text-secondary"
              >
                <span className="size-1.5 rounded-full bg-secondary" aria-hidden />
                {app}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-outline">No connected apps yet.</p>
        )}
      </div>

      {composio.toolkits.length > 0 ? (
        <div>
          <p className={cn(typography.labelCaps, 'mb-1.5 text-[10px] text-on-surface-variant')}>Available toolkits</p>
          <div className="flex flex-wrap gap-1.5">
            {composio.toolkits.slice(0, 12).map((tk) => (
              <span
                key={tk}
                className="rounded-full border border-white/8 bg-white/[0.02] px-2.5 py-1 font-mono text-[10px] text-on-surface-variant"
              >
                {tk}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-white/5 bg-surface-container/30 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-body-sm">
            <GarrettIcon name="terminal" size={16} className="text-secondary" />
            <span className="font-medium">CLI mode</span>
          </span>
          <StatusChip label={composio.cliMode ? 'Recommended' : 'Off'} tone={composio.cliMode ? 'good' : 'idle'} size="inline" />
        </div>
        <p className="mt-1 text-[11px] text-on-surface-variant">
          Agents call the Composio CLI inside supervised tmux runs. This is the supported mode.
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-2 text-body-sm">
            <GarrettIcon name="hub" size={16} className="text-outline" />
            <span className="font-medium">MCP mode</span>
          </span>
          <StatusChip label={composio.mcpMode ? 'Enabled' : 'Dev-only'} tone={composio.mcpMode ? 'warn' : 'idle'} size="inline" />
        </div>
        <p className="mt-1 text-[11px] text-on-surface-variant">
          Optional / dev-only. Not used for production agent runs.
        </p>
      </div>

      <p className="font-mono text-[9px] text-outline">source: {source} · display only — no actions execute from here</p>
    </div>
  );
}

function ReadinessRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-on-surface-variant">
        <span
          className={cn(
            'grid size-4 shrink-0 place-items-center rounded-full',
            ok ? 'bg-secondary/15 text-secondary' : 'bg-white/5 text-outline',
          )}
          aria-hidden
        >
          {ok ? <GarrettIcon name="check" size={10} /> : <GarrettIcon name="close" size={10} />}
        </span>
        {label}
      </span>
      <span className="font-mono text-[10px] text-outline">{detail}</span>
    </li>
  );
}
