export * from "./ai.ts";
export * from "./auth.ts";
export * from "./billing.ts";
export * from "./payment.ts";
export * from "./providers.ts";

export type ArchivableRecord = { archivedAt: string | null };
export type HistoricalReference<T> = { current: T | null; snapshotLabel: string | null; wasArchived: boolean };

export function isActiveRecord(record: ArchivableRecord) {
  return record.archivedAt === null;
}

export function historicalReferenceLabel(input: { currentLabel: string | null; snapshotLabel: string | null; wasArchived: boolean }, deletedSuffix = "(deleted)") {
  if (input.currentLabel && !input.wasArchived) return input.currentLabel;
  const label = input.snapshotLabel ?? input.currentLabel ?? "Unknown item";
  return `${label} ${deletedSuffix}`;
}
