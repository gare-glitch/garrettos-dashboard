export type GarminImportKind = 'csv' | 'fit' | 'tcx';

export type GarminImportRequest = {
  userId: string;
  fileName: string;
  kind: GarminImportKind;
  storagePath?: string;
};

export function detectGarminKind(fileName: string): GarminImportKind | null {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'csv' || extension === 'fit' || extension === 'tcx') return extension;
  return null;
}

export function createGarminImportEvent(input: GarminImportRequest) {
  return {
    event_type: 'health' as const,
    title: `Garmin ${input.kind.toUpperCase()} import queued`,
    payload: { fileName: input.fileName, storagePath: input.storagePath, parserStatus: 'scaffolded' },
  };
}
