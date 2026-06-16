export type ObsidianSyncRequest = {
  userId: string;
  vault: string;
  paths: string[];
};

export function createObsidianSyncEvent(input: ObsidianSyncRequest) {
  return {
    event_type: 'memory' as const,
    title: `Obsidian sync queued for ${input.vault}`,
    payload: { vault: input.vault, paths: input.paths, chunkingStatus: 'scaffolded' },
  };
}
