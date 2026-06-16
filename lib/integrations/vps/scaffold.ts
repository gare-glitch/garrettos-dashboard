export type VpsMetricSnapshot = {
  host: string;
  cpuPercent: number;
  ramPercent: number;
  diskPercent: number;
  serviceStatus: Record<string, string>;
  modelList: string[];
};

export function normalizeVpsSnapshot(snapshot: VpsMetricSnapshot) {
  return {
    ...snapshot,
    health: snapshot.cpuPercent < 85 && snapshot.ramPercent < 90 && snapshot.diskPercent < 90 ? 'healthy' : 'attention',
  };
}
