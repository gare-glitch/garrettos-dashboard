import { Card } from '@/components/Card';
import { DataRow } from '@/components/DataRow';
import { PageHeader } from '@/components/PageHeader';
import { DashboardGrid } from '@/components/layout-grid';
import { Badge } from '@/components/ui/badge';
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

function statusVariant(status: IntegrationStatus): 'success' | 'default' | 'warning' | 'destructive' {
  if (status === 'connected') return 'success';
  if (status === 'mocked') return 'default';
  if (status === 'missing env') return 'warning';
  return 'destructive';
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Integration Status Center"
        description="Control center for what is connected, what is mocked, and what needs setup next."
      />

      <DashboardGrid>
        <Card title="Onboarding checklist" eyebrow="Setup" className="md:col-span-12">
          <ul className="grid gap-2 md:grid-cols-3">
            {checklist.map((item) => (
              <li
                key={item.label}
                className={cn(
                  'flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium',
                  item.done ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'grid size-6 place-items-center rounded-full text-xs',
                    item.done ? 'bg-green/15 text-green' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {item.done ? '✓' : '•'}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </Card>

        {integrations.map((integration) => {
          const status = getStatus(integration);
          return (
            <Card title={integration.name} eyebrow="Integration" className="md:col-span-6" key={integration.name}>
              <DataRow label="Status" value={<Badge variant={statusVariant(status)}>{status}</Badge>} />
              <div className="space-y-2 border-t border-border py-3">
                <small className="text-xs text-muted-foreground">Required env vars</small>
                <code className="block rounded-xl border border-border bg-input/70 p-3 text-xs text-cyan">
                  {integration.env.join(', ')}
                </code>
              </div>
              <div className="space-y-2 border-t border-border py-3">
                <small className="text-xs text-muted-foreground">Next setup step</small>
                <p className="text-sm text-muted-foreground">{integration.nextStep}</p>
              </div>
              <DataRow label="Last checked" value="Not checked yet" />
            </Card>
          );
        })}
      </DashboardGrid>
    </div>
  );
}
