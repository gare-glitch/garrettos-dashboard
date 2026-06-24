import type { StatusTone } from '@/components/garrettos/types';

export const osCommands = [
  { id: 'cmd-health', label: 'Sync Garmin data', group: 'Health', href: '/health' },
  { id: 'cmd-agent', label: 'Review agent approvals', group: 'Agents', href: '/openclaw' },
  { id: 'cmd-memory', label: 'Search Obsidian memory', group: 'Memory', href: '/memory' },
  { id: 'cmd-mentor', label: 'Ask AI mentor', group: 'AI', href: '/mentor' },
  { id: 'cmd-system', label: 'Check VPS topology', group: 'System', href: '/system' },
];

export const osPriorities = [
  { id: 'p1', label: 'Approve OpenClaw VPS deploy', module: 'OpenClaw', urgency: 'warn' as StatusTone },
  { id: 'p2', label: 'Review Garmin recovery trend', module: 'Health', urgency: 'info' as StatusTone },
  { id: 'p3', label: 'Ship Content Engine report', module: 'Revenue', urgency: 'good' as StatusTone },
  { id: 'p4', label: 'Refill creatine inventory', module: 'Water', urgency: 'warn' as StatusTone },
];

export const osEvents = [
  { id: 'e1', time: '09:12', source: 'OpenClaw', message: 'Codex queued Garmin CSV parser', tone: 'info' as StatusTone },
  { id: 'e2', time: '09:04', source: 'Garmin', message: 'Body Battery peaked at 91', tone: 'good' as StatusTone },
  { id: 'e3', time: '08:47', source: 'LiteLLM', message: 'Routed mentor request to Claude', tone: 'info' as StatusTone },
  { id: 'e4', time: '08:31', source: 'Obsidian', message: 'Indexed 12 new memory chunks', tone: 'good' as StatusTone },
  { id: 'e5', time: '08:15', source: 'VPS', message: 'Qdrant compaction completed', tone: 'idle' as StatusTone },
  { id: 'e6', time: '07:58', source: 'Composio', message: 'GitHub webhook received', tone: 'info' as StatusTone },
];

export const osTasks = [
  { id: 't1', title: 'Parse Garmin export', status: 'running' as const, agent: 'Codex', priority: 'high' as const },
  { id: 't2', title: 'Schema review', status: 'review' as const, agent: 'Claude', priority: 'medium' as const },
  { id: 't3', title: 'VPS health probe', status: 'blocked' as const, agent: 'OpenCode', priority: 'high' as const },
  { id: 't4', title: 'Weekly revenue digest', status: 'queued' as const, agent: 'OpenClaw', priority: 'low' as const },
];

export const osMemory = [
  { id: 'm1', title: 'GarrettOS Phase 2 architecture', source: 'Obsidian', timestamp: '2h ago', tags: ['dashboard', 'phase-2'] },
  { id: 'm2', title: 'OpenClaw VPS bridge decision', source: 'OpenClawMemory', timestamp: '5h ago', tags: ['vps', 'security'] },
  { id: 'm3', title: 'Lean bulk protocol', source: 'Obsidian', timestamp: '1d ago', tags: ['health', 'gym'] },
  { id: 'm4', title: 'LiteLLM routing policy', source: 'Obsidian', timestamp: '2d ago', tags: ['ai', 'infra'] },
];

export const osAgents = {
  nodes: [
    { id: 'a1', label: 'OpenClaw', status: 'active' as const, load: 72 },
    { id: 'a2', label: 'Codex', status: 'active' as const, load: 45 },
    { id: 'a3', label: 'Claude', status: 'idle' as const, load: 18 },
    { id: 'a4', label: 'Ollama', status: 'active' as const, load: 61 },
    { id: 'a5', label: 'Composio', status: 'idle' as const, load: 12 },
    { id: 'a6', label: 'ElevenLabs', status: 'idle' as const, load: 5 },
  ],
  edges: [
    { from: 'OpenClaw', to: 'LiteLLM', label: 'route' },
    { from: 'LiteLLM', to: 'Claude' },
    { from: 'OpenClaw', to: 'Ollama' },
    { from: 'Composio', to: 'OpenClaw' },
  ],
};

export const osTopology = [
  { id: 's1', label: 'LiteLLM Gateway', kind: 'service' as const, status: 'good' as StatusTone, metric: '31ms' },
  { id: 's2', label: 'Ollama (local)', kind: 'model' as const, status: 'good' as StatusTone, metric: '4 models' },
  { id: 's3', label: 'Qdrant', kind: 'storage' as const, status: 'good' as StatusTone, metric: '248k vec' },
  { id: 's4', label: 'Valkey', kind: 'queue' as const, status: 'info' as StatusTone, metric: '12 jobs' },
  { id: 's5', label: 'TimesFM', kind: 'model' as const, status: 'idle' as StatusTone, metric: 'standby' },
  { id: 's6', label: 'Hetzner VPS', kind: 'service' as const, status: 'good' as StatusTone, metric: '31% CPU' },
];

export const osResearch = [
  { id: 'r1', title: 'Agent approval patterns in production', status: 'reading' as const, source: 'ArXiv' },
  { id: 'r2', title: 'Garmin HRV forecasting with TimesFM', status: 'queued' as const, source: 'Internal' },
  { id: 'r3', title: 'Composio tool routing benchmarks', status: 'synthesizing' as const, source: 'Web' },
];

export const osOpportunities = [
  { id: 'o1', title: 'Automate weekly client reports', value: '$2.4k/mo', confidence: 82 },
  { id: 'o2', title: 'Deploy memory RAG for mentor', value: 'High leverage', confidence: 91 },
  { id: 'o3', title: 'Garmin → TimesFM recovery model', value: 'Health ROI', confidence: 74 },
];

export const osApprovals = [
  { id: 'ap1', action: 'Deploy VPS bridge', agent: 'OpenClaw', risk: 'high' as const },
  { id: 'ap2', action: 'Run Garmin CSV import', agent: 'Codex', risk: 'low' as const },
  { id: 'ap3', action: 'Publish revenue digest', agent: 'OpenClaw', risk: 'medium' as const },
];

export const osModelRoutes = [
  { provider: 'Anthropic', model: 'claude-sonnet', usage: 42, latency: '1.2s', status: 'good' as StatusTone },
  { provider: 'Ollama', model: 'llama3.1:8b', usage: 28, latency: '340ms', status: 'good' as StatusTone },
  { provider: 'LiteLLM', model: 'gpt-4o-mini', usage: 18, latency: '890ms', status: 'info' as StatusTone },
  { provider: 'OpenClaw', model: 'vps-bridge', usage: 12, latency: '2.1s', status: 'warn' as StatusTone },
];

export const osApiUsage = [
  { service: 'LiteLLM', calls: 1240, cost: '$18.40', trend: [12, 18, 15, 22, 19, 24, 28] },
  { service: 'Composio', calls: 340, cost: '$4.20', trend: [4, 6, 5, 8, 7, 9, 11] },
  { service: 'ElevenLabs', calls: 28, cost: '$1.10', trend: [1, 2, 1, 3, 2, 4, 3] },
];

export const osRevenue = {
  mtd: 12400,
  delta: '+8.2%',
  sparkline: [8.2, 8.6, 9.1, 10.4, 11.2, 11.8, 12.4],
};

export const osGarminSummary = {
  bodyBattery: 89,
  sleep: 90,
  hrv: 62,
  recovery: 89,
  trend: [71, 76, 88, 76, 91, 84, 89],
};
