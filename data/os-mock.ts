import type { StatusTone } from '@/components/garrettos/types';

export const osCommands = [
  { id: 'cmd-memory', label: 'Open Memory', group: 'Quick actions', href: '/memory', icon: 'psychology' as const },
  { id: 'cmd-agent', label: 'Launch Agent', group: 'Quick actions', href: '/openclaw', icon: 'smart_toy' as const },
  { id: 'cmd-tasks', label: 'Search Tasks', group: 'Quick actions', href: '/openclaw', icon: 'sync' as const },
  { id: 'cmd-system', label: 'View System', group: 'Quick actions', href: '/system', icon: 'terminal' as const },
  { id: 'cmd-mentor', label: 'Ask Garrett', group: 'Quick actions', href: '/mentor', icon: 'auto_awesome' as const },
  { id: 'cmd-health', label: 'Sync Garmin data', group: 'Recent', href: '/health', icon: 'ecg_heart' as const },
  { id: 'cmd-settings', label: 'Open Settings', group: 'Recent', href: '/settings', icon: 'settings' as const },
];

export const osShellTelemetry = {
  cpu: '24%',
  mem: '12.4 GB',
  lat: '12ms',
  api: '1.2k/hr',
  activeModel: 'GPT-4o',
  agentStatus: 'Active' as const,
  activeAgents: 3,
};

export const osRecentCommands = [
  { id: 'rc1', label: 'Search memory: architecture', timestamp: '2m ago' },
  { id: 'rc2', label: 'Deploy OpenClaw bridge', timestamp: '14m ago' },
  { id: 'rc3', label: 'Sync Garmin export', timestamp: '1h ago' },
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
  { id: 'm5', title: 'Garmin HRV forecasting notes', source: 'Obsidian', timestamp: '3d ago', tags: ['health', 'timesfm'] },
  { id: 'm6', title: 'Composio tool routing benchmarks', source: 'OpenClawMemory', timestamp: '4d ago', tags: ['agents', 'composio'] },
];

export const osMemoryDecisions = [
  { id: 'd1', title: 'Adopt LiteLLM as primary router', decided: '2d ago', rationale: 'Cost + latency win over direct provider calls' },
  { id: 'd2', title: 'Run Ollama locally for <8B models', decided: '4d ago', rationale: 'Eliminates egress for fast drafts' },
  { id: 'd3', title: 'Qdrant over Weaviate for vector store', decided: '1w ago', rationale: 'Lower memory footprint on VPS' },
];

export const osMemoryTodos = [
  { id: 't1', title: 'Wire Supabase RLS for memory chunks', due: 'Today', priority: 'high' as const },
  { id: 't2', title: 'Export OpenClawMemory to Obsidian', due: 'This week', priority: 'medium' as const },
  { id: 't3', title: 'Backfill HRV tagging on older chunks', due: 'Next week', priority: 'low' as const },
];

export const osMemoryActiveProjects = [
  { id: 'ap1', title: 'GarrettOS Command Center', chunks: 64, updated: '2h ago' },
  { id: 'ap2', title: 'OpenClaw VPS Bridge', chunks: 38, updated: '5h ago' },
  { id: 'ap3', title: 'Content Engine v2', chunks: 22, updated: '1d ago' },
];

export const osNeuralIndex = [
  { id: 'ni1', title: 'GarrettOS Phase 2 architecture', source: 'Obsidian', timestamp: '2h ago', tags: ['dashboard', 'phase-2'], chunks: 12, relevance: 98 },
  { id: 'ni2', title: 'OpenClaw VPS bridge decision', source: 'OpenClawMemory', timestamp: '5h ago', tags: ['vps', 'security'], chunks: 8, relevance: 91 },
  { id: 'ni3', title: 'LiteLLM routing policy', source: 'Obsidian', timestamp: '2d ago', tags: ['ai', 'infra'], chunks: 6, relevance: 84 },
  { id: 'ni4', title: 'Lean bulk protocol', source: 'Obsidian', timestamp: '1d ago', tags: ['health', 'gym'], chunks: 4, relevance: 72 },
  { id: 'ni5', title: 'Garmin HRV forecasting notes', source: 'Obsidian', timestamp: '3d ago', tags: ['health', 'timesfm'], chunks: 9, relevance: 68 },
];

export const osMemoryStats = {
  totalChunks: 248,
  newToday: 12,
  sources: 2,
  lastSync: '2h ago',
  decisions: 3,
  todos: 3,
  activeProjects: 3,
};

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
  stress: 22,
  trend: [71, 76, 88, 76, 91, 84, 89],
};

export const osWeather = {
  day: 'Monday',
  date: 'Oct 24, 2024',
  temp: 18,
  unit: '°C',
  condition: 'cloud' as const,
};

export const osWaterSummary = {
  intake: 62,
  goal: 120,
  unit: 'oz',
  supplementsDue: 2,
};

export const osAgenda = [
  { id: 'a1', time: '09:00', title: 'LLM Architecture Review', location: 'Engineering Suite A', accent: 'primary' as const },
  { id: 'a2', time: '11:30', title: 'Revenue Sync', location: 'Stripe Dashboard', accent: 'idle' as const },
  { id: 'a3', time: '14:00', title: 'Agent Deployment', location: 'Vercel Edge', accent: 'secondary' as const },
];

export const osPinnedProjects = [
  { id: 'pp1', name: 'GarrettOS Command Center', progress: 72, tag: 'Active' },
  { id: 'pp2', name: 'Content Engine v2', progress: 45, tag: 'Queued' },
  { id: 'pp3', name: 'OpenClaw VPS Bridge', progress: 88, tag: 'Review' },
];

export const osCurrentProject = {
  name: 'Aether v2',
  phase: 'Alpha Testing',
  progress: 68,
};

export const osActiveNotes = [
  { id: 'n1', name: 'Neural Routing v3.md' },
  { id: 'n2', name: 'API Keys_Vault.enc' },
  { id: 'n3', name: 'Garmin recovery protocol.md' },
];

export const osAssistantMessages = [
  {
    id: 'm1',
    role: 'assistant' as const,
    content:
      "Good morning, Garrett. I've finished the market analysis for Project Aether. Revenue projections are up 12% following the model optimization. Would you like to review the research notes?",
    time: 'Just now',
  },
  {
    id: 'm2',
    role: 'user' as const,
    content: "Yes, let's look at the current active notes. Update the routing stats for the O1 model while you're at it.",
    time: 'Sent',
  },
];

export const osAgentSwarm = [
  { id: 'sw1', name: 'MarketScanner', status: 'idle' as const },
  { id: 'sw2', name: 'LeadGen_Pro', status: 'active' as const },
  { id: 'sw3', name: 'RepoSync_Bot', status: 'wait' as const },
];

export const osSystemHealth = [
  { label: 'VPS (Frankfurt)', value: '12ms', tone: 'good' as StatusTone },
  { label: 'Model Routing', value: 'GPT-4o (94%)', tone: 'good' as StatusTone },
  { label: 'API Token Usage', value: '88%', tone: 'warn' as StatusTone },
];

export const osSystemLogs = [
  { id: 'l1', time: '14:24:02', level: 'INFO' as const, source: 'LiteLLM', message: 'Routed request to claude-sonnet (1.2s)' },
  { id: 'l2', time: '14:23:58', level: 'INFO' as const, source: 'Qdrant', message: 'Indexed 12 new vectors → collection: memory' },
  { id: 'l3', time: '14:23:41', level: 'WARN' as const, source: 'OpenClaw', message: 'Approval pending for VPS bridge deploy' },
  { id: 'l4', time: '14:23:12', level: 'INFO' as const, source: 'Ollama', message: 'Loaded llama3.1:8b into VRAM (4.1 GB)' },
  { id: 'l5', time: '14:22:55', level: 'DEBUG' as const, source: 'Valkey', message: 'Queue depth: 12 jobs, 2 priority' },
  { id: 'l6', time: '14:22:30', level: 'ERROR' as const, source: 'OpenClaw', message: 'Webhook timeout from GitHub (retrying)' },
  { id: 'l7', time: '14:22:01', level: 'INFO' as const, source: 'Composio', message: 'Tool routing benchmark complete (38ms)' },
  { id: 'l8', time: '14:21:44', level: 'INFO' as const, source: 'VPS', message: 'Qdrant compaction completed (248k vec)' },
];

export const osTerminalLines = [
  { id: 'tl1', text: '$ openclaw status', tone: 'outline' as const },
  { id: 'tl2', text: '→ bridge: connected (vps-bridge-x8a2)', tone: 'secondary' as const },
  { id: 'tl3', text: '→ agents: 3 active, 2 idle', tone: 'primary' as const },
  { id: 'tl4', text: '→ memory: 248 chunks indexed', tone: 'tertiary' as const },
  { id: 'tl5', text: '→ approvals: 3 pending', tone: 'primary' as const },
  { id: 'tl6', text: '→ last error: webhook timeout (resolved)', tone: 'error' as const },
  { id: 'tl7', text: '$ deploy --dry-run', tone: 'outline' as const },
  { id: 'tl8', text: '✓ dry-run complete — no changes required', tone: 'secondary' as const },
];

export type AgentFleetRow = {
  id: string;
  name: string;
  model: string;
  status: 'active' | 'idle' | 'error';
  latency: string;
  uptime: string;
};

export const osAgentFleet: AgentFleetRow[] = [
  { id: 'af1', name: 'Cortex-Prime-01', model: 'LLM-70B-V3', status: 'active', latency: '24ms', uptime: '99.98%' },
  { id: 'af2', name: 'Synthetix-Node-B', model: 'VISION-TR-4', status: 'idle', latency: '--', uptime: '84.22%' },
  { id: 'af3', name: 'Logic-Gate-Delta', model: 'QUANTUM-X1', status: 'error', latency: '482ms', uptime: '12.05%' },
  { id: 'af4', name: 'Deep-Thought-04', model: 'NEURAL-MAP-B', status: 'active', latency: '18ms', uptime: '99.99%' },
];

export const osTmuxSessions = [
  { id: 'tm1', name: 'openclaw-bridge', attached: true, command: 'tail -f /var/log/openclaw.log' },
  { id: 'tm2', name: 'codex-garmin', attached: false, command: 'node parse-garmin.js' },
  { id: 'tm3', name: 'claude-review', attached: true, command: 'claude --review schema.sql' },
];

export const osGuardrails = [
  { id: 'g1', label: 'Privileged deploys require approval', enabled: true },
  { id: 'g2', label: 'Network egress allowlist enforced', enabled: true },
  { id: 'g3', label: 'Secrets never serialized to logs', enabled: true },
  { id: 'g4', label: 'Auto-rollback on healthcheck failure', enabled: false },
];

export const osSystemContainers = [
  { id: 'c1', name: 'ollama', status: 'running', cpu: 18, mem: 4.1, uptime: '6d 2h' },
  { id: 'c2', name: 'litellm', status: 'running', cpu: 8, mem: 0.6, uptime: '6d 2h' },
  { id: 'c3', name: 'qdrant', status: 'running', cpu: 12, mem: 1.8, uptime: '6d 2h' },
  { id: 'c4', name: 'valkey', status: 'running', cpu: 3, mem: 0.2, uptime: '6d 2h' },
  { id: 'c5', name: 'openclaw-bridge', status: 'restart', cpu: 0, mem: 0.1, uptime: '12m' },
];

export const osWorkspaceStatus = {
  mode: 'Agent Active' as const,
  summary: '3 agents running · 248 memory chunks · VPS healthy',
  generating: true,
};
