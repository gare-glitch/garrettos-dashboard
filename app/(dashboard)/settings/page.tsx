import { GlassPanel, SectionHeader, SectionHeaderCompact, StatusChip } from '@/components/garrettos';
import { spacing } from '@/lib/design-system';
import { cn } from '@/lib/utils';

type IntegrationStatus = 'connected' | 'mocked' | 'missing env' | 'error';

type Integration = {
  name: string;
  env: string[];
  nextStep: string;
  mocked?: boolean;
  error?: boolean;
};

const integrations: Integration[] = [
  { name: 'Supabase', env: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'], nextStep: 'Add the Supabase project URL and anon key in Vercel, then verify auth redirects.' },
  { name: 'Garmin', env: ['GARMIN_USERNAME', 'GARMIN_PASSWORD'], nextStep: 'Connect Garmin credentials or keep imports pending until the secure importer is enabled.', mocked: true },
  { name: 'Obsidian/OpenClawMemory', env: ['OBSIDIAN_VAULT_PATH', 'OPENCLAW_MEMORY_API_URL'], nextStep: 'Point the sync job at the Obsidian vault or OpenClawMemory API endpoint.', mocked: true },
  { name: 'OpenClaw VPS bridge', env: ['OPENCLAW_VPS_BRIDGE_URL', 'OPENCLAW_VPS_BRIDGE_TOKEN'], nextStep: 'Deploy the bridge on the VPS and store its URL plus token in the dashboard environment.', mocked: true },
  { name: 'GitHub/Codex', env: ['GITHUB_TOKEN', 'CODEX_WEBHOOK_SECRET'], nextStep: 'Create a scoped GitHub token and webhook secret for Codex automation events.', mocked: true },
  { name: 'Ollama', env: ['OLLAMA_BASE_URL'], nextStep: 'Expose the Ollama base URL through the VPS bridge or private network.', mocked: true },
  { name: 'LiteLLM', env: ['LITELLM_BASE_URL', 'LITELLM_API_KEY'], nextStep: 'Add the LiteLLM gateway URL and API key once the router is deployed.', mocked: true },
  { name: 'Qdrant', env: ['QDRANT_URL', 'QDRANT_API_KEY'], nextStep: 'Provision Qdrant and add the collection endpoint plus API key.', mocked: true },
  { name: 'Valkey', env: ['VALKEY_URL'], nextStep: 'Provision Valkey for queues/cache and add its connection URL.', mocked: true },
  { name: 'Vercel', env: ['VERCEL_URL'], nextStep: 'Deploy the project on Vercel and confirm production environment variables.', mocked: true },
];

const checklist = [
  { label: 'Vercel deployed', done: Boolean(process.env.VERCEL_URL) },
  { label: 'Supabase env vars added', done: hasAllEnv(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) },
  { label: 'Auth bypass enabled', done: process.env.NEXT_PUBLIC_AUTH_BYPASS === 'true' },
  { label: 'Supabase redirect URLs configured', done: false },
  { label: 'Database migration pending/done', done: false },
  { label: 'Garmin import pending', done: false },
  { label: 'OpenClaw bridge pending', done: false },
  { label: 'Obsidian sync pending', done: false },
  { label: 'VPS metrics pending', done: false },
];

function hasAllEnv(env: string[]) {
  return env.every((key) => Boolean(process.env[key]));
}

function getStatus(integration: Integration): IntegrationStatus {
  if (integration.error) return 'error';
  if (!hasAllEnv(integration.env)) return 'missing env';
  if (integration.mocked) return 'mocked';
  return 'connected';
}

function statusTone(status: IntegrationStatus): 'good' | 'warn' | 'info' | 'bad' | 'idle' {
  if (status === 'connected') return 'good';
  if (status === 'mocked') return 'info';
  if (status === 'missing env') return 'warn';
  return 'bad';
}

export default function SettingsPage() {
  return (
    <div className={spacing.page}>
      <SectionHeader
        eyebrow="Settings"
        title="Integration Status Center"
        description="Control center for what is connected, what is mocked, and what needs setup next."
      />

      <GlassPanel className="p-4">
        <SectionHeaderCompact title="Onboarding checklist" meta={<StatusChip label={`${checklist.filter((c) => c.done).length}/${checklist.length}`} tone="info" />} />
        <ul className="mt-3 grid gap-2 md:grid-cols-3">
          {checklist.map((item) => (
            <li
              key={item.label}
              className={cn(
                'flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium',
                item.done ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <span className={cn('grid size-5 place-items-center rounded-full text-[10px]', item.done ? 'bg-green/15 text-green' : 'bg-muted text-muted-foreground')}>
                {item.done ? '✓' : '•'}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </GlassPanel>

      <div className="os-bento">
        {integrations.map((integration) => {
          const status = getStatus(integration);
          return (
            <GlassPanel key={integration.name} className="col-span-2 p-4 md:col-span-6">
              <SectionHeaderCompact title={integration.name} meta={<StatusChip label={status} tone={statusTone(status)} />} />
              <div className="mt-3 space-y-3 text-xs">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Required env vars</p>
                  <code className="mt-1 block rounded-lg border border-border bg-input/50 p-2 font-mono text-[10px] text-cyan">
                    {integration.env.join(', ')}
                  </code>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Next setup step</p>
                  <p className="mt-1 text-muted-foreground">{integration.nextStep}</p>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2">
                  <span className="text-muted-foreground">Last checked</span>
                  <span>Not checked yet</span>
                </div>
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}
