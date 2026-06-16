export type OpenClawStatus = {
  provider: 'codex' | 'claude' | 'opencode' | 'openclaw';
  status: 'queued' | 'running' | 'blocked' | 'review_needed' | 'approved' | 'completed' | 'failed';
  title: string;
  repo?: string;
};

export function normalizeOpenClawStatus(input: OpenClawStatus) {
  return { ...input, requiresApproval: input.status === 'review_needed' || input.status === 'blocked' };
}
