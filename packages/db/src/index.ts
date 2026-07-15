export type FoundationTable = "user_profiles" | "billing_orders" | "billing_subscriptions" | "billing_entitlements" | "billing_credit_ledger" | "billing_usage_ledger" | "payment_events";
export type RlsEvidence = { table: FoundationTable; enabled: boolean; ownerRead: boolean; ownerWrite: boolean; serviceWrite: boolean };
export type SchemaEvidence = { migration: string; tables: FoundationTable[]; verifiedAt: string };
export type SchemaVersion = Readonly<{ id: string; appliedAt?: string; description?: string }>;
export type RlsPolicyKind = "owner-only" | "public-read" | "service-only";
export type DbAccessScope = Readonly<{ actorId?: string; ownerId?: string; tenantId?: string; policy: RlsPolicyKind }>;
export type DbBoundaryResult<T> = Readonly<{ ok: true; data: T }> | Readonly<{ ok: false; code: "missing_scope" | "scope_mismatch"; message: string }>;
export type MigrationCheck = Readonly<{ name: string; status: "pass" | "fail" | "not_run"; evidence?: string }>;
export type DatabaseBoundaryEvidence = Readonly<{ schemaVersion: SchemaVersion; rlsChecks: readonly MigrationCheck[]; migrationChecks: readonly MigrationCheck[] }>;
export function defineSchemaVersion(id: string, description?: string, appliedAt?: string): SchemaVersion { return { id, description, appliedAt }; }
export function formatSchemaVersion(version: SchemaVersion): string { return version.appliedAt ? `${version.id} @ ${version.appliedAt}` : version.id; }
export function createOwnerScope(actorId: string, ownerId: string): DbBoundaryResult<DbAccessScope> {
  if (!actorId || !ownerId) return { ok: false, code: "missing_scope", message: "Both actorId and ownerId are required." };
  if (actorId !== ownerId) return { ok: false, code: "scope_mismatch", message: "Actor scope does not match owner scope." };
  return { ok: true, data: { actorId, ownerId, policy: "owner-only" } };
}
