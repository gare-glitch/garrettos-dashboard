import type { StatusTone } from '@/components/garrettos/types';

export type IntegrationStatus = 'connected' | 'mocked' | 'missing env' | 'error';

export type IntegrationGroup = {
  id: string;
  title: string;
  icon: string;
  integrations: Integration[];
};

export type Integration = {
  name: string;
  env: string[];
  nextStep: string;
  category: 'core' | 'model' | 'infra' | 'future';
  mocked?: boolean;
  error?: boolean;
  apiKey?: string;
  maskedKey?: string;
  lastUsed?: string;
};

export const integrationGroups: IntegrationGroup[] = [
  {
    id: 'core',
    title: 'Core Platform',
    icon: 'settings',
    integrations: [
      {
        name: 'Supabase',
        env: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
        nextStep: 'Add the Supabase project URL and anon key in Vercel, then verify auth redirects.',
        category: 'core',
        apiKey: 'sb-anon-x7f3...92ab',
        lastUsed: '2 mins ago',
      },
      {
        name: 'Vercel',
        env: ['VERCEL_URL'],
        nextStep: 'Deploy the project on Vercel and confirm production environment variables.',
        category: 'core',
        mocked: true,
        apiKey: 'vercel_deploy_x8a2',
        lastUsed: '14m ago',
      },
      {
        name: 'GitHub / Codex',
        env: ['GITHUB_TOKEN', 'CODEX_WEBHOOK_SECRET'],
        nextStep: 'Create a scoped GitHub token and webhook secret for Codex automation events.',
        category: 'core',
        mocked: true,
        apiKey: 'ghp_x29f...c4e1',
        lastUsed: '1h ago',
      },
    ],
  },
  {
    id: 'model',
    title: 'Model & Intelligence',
    icon: 'psychology',
    integrations: [
      {
        name: 'LiteLLM',
        env: ['LITELLM_BASE_URL', 'LITELLM_API_KEY'],
        nextStep: 'Add the LiteLLM gateway URL and API key once the router is deployed.',
        category: 'model',
        mocked: true,
        apiKey: 'sk-litellm-x7f3...92ab',
        lastUsed: '3m ago',
      },
      {
        name: 'Ollama (local)',
        env: ['OLLAMA_BASE_URL'],
        nextStep: 'Expose the Ollama base URL through the VPS bridge or private network.',
        category: 'model',
        mocked: true,
        apiKey: 'ollama_local_5582',
        lastUsed: '8m ago',
      },
      {
        name: 'OpenRouter / Z.ai',
        env: ['OPENROUTER_API_KEY', 'ZAI_API_KEY'],
        nextStep: 'Add OpenRouter or Z.ai keys for fallback routing.',
        category: 'future',
        mocked: true,
        apiKey: 'sk-or-x9a4...1f2c',
        lastUsed: 'Not yet',
      },
      {
        name: 'NVIDIA NIM',
        env: ['NVIDIA_NIM_API_KEY'],
        nextStep: 'Provision NVIDIA NIM access for GPU inference.',
        category: 'future',
        mocked: true,
        apiKey: 'nvapi-x2f8...c4a1',
        lastUsed: 'Not yet',
      },
    ],
  },
  {
    id: 'infra',
    title: 'Infrastructure & Memory',
    icon: 'dns',
    integrations: [
      {
        name: 'OpenClaw VPS bridge',
        env: ['OPENCLAW_VPS_BRIDGE_URL', 'OPENCLAW_VPS_BRIDGE_TOKEN'],
        nextStep: 'Deploy the bridge on the VPS and store its URL plus token in the dashboard environment.',
        category: 'infra',
        mocked: true,
        apiKey: 'vps_bridge_x8a2...c4e1',
        lastUsed: '5h ago',
      },
      {
        name: 'Qdrant',
        env: ['QDRANT_URL', 'QDRANT_API_KEY'],
        nextStep: 'Provision Qdrant and add the collection endpoint plus API key.',
        category: 'infra',
        mocked: true,
        apiKey: 'qdrant_x29f...c4e1',
        lastUsed: '21m ago',
      },
      {
        name: 'Valkey',
        env: ['VALKEY_URL'],
        nextStep: 'Provision Valkey for queues/cache and add its connection URL.',
        category: 'infra',
        mocked: true,
        apiKey: 'valkey://x7f3:5582',
        lastUsed: '4m ago',
      },
    ],
  },
  {
    id: 'future',
    title: 'Future Integrations',
    icon: 'rocket_launch',
    integrations: [
      {
        name: 'Composio',
        env: ['COMPOSIO_API_KEY'],
        nextStep: 'Connect Composio for tool routing across agents.',
        category: 'future',
        mocked: true,
        apiKey: 'composio_x9a4...1f2c',
        lastUsed: 'Not yet',
      },
      {
        name: 'ElevenLabs',
        env: ['ELEVENLABS_API_KEY'],
        nextStep: 'Add ElevenLabs API key for voice synthesis.',
        category: 'future',
        mocked: true,
        apiKey: 'el_x7f3...92ab',
        lastUsed: 'Not yet',
      },
      {
        name: 'TimesFM',
        env: ['TIMESFM_ENDPOINT'],
        nextStep: 'Stand up TimesFM for HRV/recovery forecasting.',
        category: 'future',
        mocked: true,
        apiKey: 'timesfm://x2f8:5582',
        lastUsed: 'Not yet',
      },
      {
        name: 'UI-TARS',
        env: ['UITARS_API_KEY'],
        nextStep: 'Add UI-TARS for desktop automation.',
        category: 'future',
        mocked: true,
        apiKey: 'uitars_x9a4...1f2c',
        lastUsed: 'Not yet',
      },
      {
        name: 'Google Antigravity',
        env: ['ANTIGRAVITY_API_KEY'],
        nextStep: 'Connect Google Antigravity for spatial reasoning.',
        category: 'future',
        mocked: true,
        apiKey: 'ag_x7f3...92ab',
        lastUsed: 'Not yet',
      },
      {
        name: 'Headroom',
        env: ['HEADROOM_API_KEY'],
        nextStep: 'Add Headroom for meeting memory capture.',
        category: 'future',
        mocked: true,
        apiKey: 'headroom_x2f8...c4a1',
        lastUsed: 'Not yet',
      },
    ],
  },
];

export const settingsNavItems = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'api-keys', label: 'API Keys', icon: 'key' },
  { id: 'integrations', label: 'Integrations', icon: 'hub' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
] as const;

export const settingsChecklist = [
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

export const settingsSecurityAlert = {
  title: 'Unencrypted export detected',
  message: 'System logs show API keys were exported in plaintext. We recommend rotating all keys.',
};

export function hasAllEnv(env: string[]) {
  return env.every((key) => Boolean(process.env[key]));
}

export function getIntegrationStatus(integration: Integration): {
  status: IntegrationStatus;
  tone: StatusTone;
} {
  if (integration.error) return { status: 'error', tone: 'bad' };
  if (!hasAllEnv(integration.env)) return { status: 'missing env', tone: 'warn' };
  if (integration.mocked) return { status: 'mocked', tone: 'info' };
  return { status: 'connected', tone: 'good' };
}

export const integrationStats = {
  connected: 0,
  mocked: 0,
  missingEnv: 0,
  total: 0,
};
