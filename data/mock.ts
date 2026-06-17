export type NavItem = { href: string; label: string; short: string };

export const navItems: NavItem[] = [
  { href: '/', label: 'Home', short: 'Home' },
  { href: '/health', label: 'Health', short: 'Health' },
  { href: '/gym', label: 'Gym', short: 'Gym' },
  { href: '/water', label: 'Water/Supps', short: 'Water' },
  { href: '/mentor', label: 'AI Mentor', short: 'Mentor' },
  { href: '/openclaw', label: 'OpenClaw', short: 'Claw' },
  { href: '/memory', label: 'Memory', short: 'Memory' },
  { href: '/system', label: 'System', short: 'System' },
  { href: '/projects', label: 'Projects/Revenue', short: 'Revenue' },
  { href: '/settings', label: 'Settings', short: 'Settings' },
];

export const ticker = [
  { label: 'Garmin', value: 'Recovery 89', tone: 'good' },
  { label: 'OpenClaw', value: '3 runs active', tone: 'info' },
  { label: 'VPS', value: 'Hetzner healthy', tone: 'good' },
  { label: 'Water', value: '62 / 120 oz', tone: 'warn' },
  { label: 'Revenue', value: '$12.4k MTD', tone: 'good' },
];

export const launcher = [
  { href: '/health', title: 'Health', metric: '89', note: 'Body Battery • HRV +8%' },
  { href: '/gym', title: 'Gym', metric: '+5 lb', note: 'Bench progressive overload' },
  { href: '/water', title: 'Water/Supps', metric: '52%', note: 'Creatine running low' },
  { href: '/mentor', title: 'AI Mentor', metric: 'Ready', note: 'Server-side provider planned' },
  { href: '/openclaw', title: 'OpenClaw', metric: '3', note: 'Queued/review actions' },
  { href: '/memory', title: 'Memory', metric: '248', note: 'Indexed Obsidian chunks' },
  { href: '/system', title: 'System', metric: '5/6', note: 'Services online' },
  { href: '/projects', title: 'Revenue', metric: '$12.4k', note: 'Projects and events' },
  { href: '/settings', title: 'Settings', metric: 'Setup', note: 'Connections and profile' },
];

export const garminDaily = [
  { date: 'Mon', sleepScore: 81, hrv: 58, restingHr: 51, stress: 26, bodyBattery: 82, steps: 11920, calories: 2810 },
  { date: 'Tue', sleepScore: 74, hrv: 52, restingHr: 54, stress: 34, bodyBattery: 71, steps: 8600, calories: 2630 },
  { date: 'Wed', sleepScore: 88, hrv: 61, restingHr: 50, stress: 22, bodyBattery: 88, steps: 13240, calories: 3010 },
  { date: 'Thu', sleepScore: 79, hrv: 55, restingHr: 53, stress: 29, bodyBattery: 76, steps: 10100, calories: 2740 },
  { date: 'Fri', sleepScore: 92, hrv: 64, restingHr: 49, stress: 19, bodyBattery: 91, steps: 14820, calories: 3180 },
  { date: 'Sat', sleepScore: 84, hrv: 59, restingHr: 52, stress: 24, bodyBattery: 84, steps: 9200, calories: 2660 },
  { date: 'Sun', sleepScore: 90, hrv: 62, restingHr: 50, stress: 21, bodyBattery: 89, steps: 7800, calories: 2510 },
];

export const gymSets = [
  { exercise: 'Bench Press', sets: '4 x 6', weight: '205 lb', trend: '+5 lb', location: 'Garage' },
  { exercise: 'Back Squat', sets: '5 x 5', weight: '275 lb', trend: '+10 lb', location: 'Iron Temple' },
  { exercise: 'Weighted Pull-up', sets: '4 x 8', weight: '+45 lb', trend: '+2 reps', location: 'Garage' },
];

export const supplements = [
  { name: 'Vitamin D3', slot: 'Morning', inventory: 34, status: 'taken' },
  { name: 'Creatine', slot: 'Lunch', inventory: 5, status: 'low' },
  { name: 'Magnesium', slot: 'Evening', inventory: 21, status: 'scheduled' },
];

export const agentRuns = [
  { title: 'Codex: Garmin CSV parser', status: 'queued', approval: 'not required yet' },
  { title: 'Claude: schema review', status: 'review_needed', approval: 'waiting' },
  { title: 'OpenCode: VPS probe', status: 'blocked', approval: 'required before deploy' },
];

export const notes = [
  { title: 'GarrettOS Phase 1', source: 'Obsidian', tags: ['dashboard', 'phase-1'] },
  { title: 'OpenClaw VPS Bridge Decision', source: 'OpenClawMemory', tags: ['vps', 'security'] },
  { title: 'Lean Bulk Protocol', source: 'Obsidian', tags: ['health', 'gym'] },
];

export const vpsMetrics = [
  { host: 'openclaw-hetzner-01', cpu: 31, ram: 42, disk: 47, services: 'Ollama, LiteLLM, Qdrant, Valkey' },
  { host: 'dashboard-vercel', cpu: 12, ram: 18, disk: 9, services: 'Next.js edge middleware' },
];

export const projects = [
  { name: 'GarrettOS', revenue: '$0', status: 'Build phase', next: 'Wire Supabase RLS helpers' },
  { name: 'OpenClaw Services', revenue: '$8.2k', status: 'Active', next: 'Review agent approvals' },
  { name: 'Content Engine', revenue: '$4.2k', status: 'Active', next: 'Publish weekly report' },
];

export const onboardingChecklist = [
  'Supabase env vars added',
  'Supabase redirect URLs configured',
  'Database migration run',
  'Garmin import pending',
  'Obsidian sync pending',
  'OpenClaw bridge pending',
  'VPS metrics pending',
];

export const settingsStatuses = [
  { label: 'Garmin connection', status: 'Placeholder' },
  { label: 'OpenClaw API', status: 'Placeholder' },
  { label: 'Obsidian vault', status: 'Placeholder' },
  { label: 'VPS monitor', status: 'Placeholder' },
];
