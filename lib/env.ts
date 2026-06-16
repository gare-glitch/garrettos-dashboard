export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  garminImportBucket: process.env.GARMIN_IMPORT_BUCKET ?? 'garmin-imports',
  obsidianImportBucket: process.env.OBSIDIAN_IMPORT_BUCKET ?? 'obsidian-imports',
  openClawApiUrl: process.env.OPENCLAW_API_URL,
  openClawApiToken: process.env.OPENCLAW_API_TOKEN,
  vpsMetricsApiUrl: process.env.VPS_METRICS_API_URL,
  vpsMetricsApiToken: process.env.VPS_METRICS_API_TOKEN,
};

export function hasSupabaseBrowserEnv() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function requireServerSecret(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing server-only environment variable: ${name}`);
  return value;
}
