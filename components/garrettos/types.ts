export type StatusTone = 'good' | 'warn' | 'info' | 'bad' | 'idle';

export type OsEvent = {
  id: string;
  time: string;
  source: string;
  message: string;
  tone: StatusTone;
};

export type OsTask = {
  id: string;
  title: string;
  status: 'queued' | 'running' | 'review' | 'blocked' | 'done';
  agent: string;
  priority: 'low' | 'medium' | 'high';
};

export type OsMemoryEntry = {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  tags: string[];
};

export type OsAgentNode = {
  id: string;
  label: string;
  status: 'active' | 'idle' | 'error';
  load: number;
};

export type OsAgentEdge = {
  from: string;
  to: string;
  label?: string;
};

export type OsSystemNode = {
  id: string;
  label: string;
  kind: 'service' | 'model' | 'queue' | 'storage';
  status: StatusTone;
  metric?: string;
};

export type OsPriority = {
  id: string;
  label: string;
  module: string;
  urgency: StatusTone;
};

export type OsModelRoute = {
  provider: string;
  model: string;
  usage: number;
  latency: string;
  status: StatusTone;
};

export type OsApiUsage = {
  service: string;
  calls: number;
  cost: string;
  trend: number[];
};

export type OsApproval = {
  id: string;
  action: string;
  agent: string;
  risk: 'low' | 'medium' | 'high';
};

export type OsResearchItem = {
  id: string;
  title: string;
  status: 'queued' | 'reading' | 'synthesizing' | 'done';
  source: string;
};

export type OsOpportunity = {
  id: string;
  title: string;
  value: string;
  confidence: number;
};
