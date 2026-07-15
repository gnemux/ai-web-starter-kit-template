import type { CapabilityMode, CapabilityReason, CapabilityState } from "@xwlc/core";
export type { CapabilityMode, CapabilityReason, CapabilityState } from "@xwlc/core";
export type AnalyticsMode = "disabled" | "external";
export type PaymentMode = "disabled" | "sandbox" | "external";
export type AiMode = "disabled" | "mock" | "external";
export type CapabilityModes = { analytics: AnalyticsMode; payment: PaymentMode; ai: AiMode };
export type CapabilityRegistryEntry = {
  id: keyof CapabilityModes;
  mode: CapabilityModes[keyof CapabilityModes];
  state: CapabilityState;
  requiredEnvironment: readonly string[];
  reason: CapabilityReason;
};

const capabilityModes = ["disabled", "sandbox", "mock", "external"] as const satisfies readonly CapabilityMode[];
export function isCapabilityMode(value: string): value is CapabilityMode { return capabilityModes.includes(value as CapabilityMode); }

const requiredEnvironment = {
  analytics: ["NEXT_PUBLIC_POSTHOG_KEY"],
  payment: [],
  ai: []
} as const;

export function resolveCapabilityRegistry(modes: CapabilityModes, environment: Record<string, string | undefined>): CapabilityRegistryEntry[] {
  return (Object.keys(modes) as Array<keyof CapabilityModes>).map((id) => {
    const mode = modes[id];
    if (mode === "disabled") return { id, mode, state: "disabled", requiredEnvironment: [], reason: "disabled" };
    if (mode === "sandbox" || mode === "mock") return { id, mode, state: "enabled", requiredEnvironment: [], reason: "safe_adapter" };
    if (id !== "analytics") return { id, mode, state: "not_implemented", requiredEnvironment: [], reason: "adapter_missing" };
    const required = requiredEnvironment[id];
    const configured = required.every((key) => key === "NEXT_PUBLIC_POSTHOG_KEY" ? /^phc_[A-Za-z0-9_-]{8,128}$/.test(environment[key] ?? "") : Boolean(environment[key]?.trim()));
    return { id, mode, state: configured ? "enabled" : "not_configured", requiredEnvironment: required, reason: configured ? "configured" : "missing_environment" };
  });
}

export function assertCapabilityConfiguration(modes: CapabilityModes, environment: Record<string, string | undefined>) {
  const missing = resolveCapabilityRegistry(modes, environment).filter((entry) => entry.state === "not_configured" || entry.state === "not_implemented");
  if (missing.length > 0) throw new Error(`External capabilities are unavailable or missing configuration: ${missing.map((entry) => `${entry.id}(${entry.requiredEnvironment.join(",") || "adapter"})`).join("; ")}`);
  return true;
}

export type PlatformActorType = "user" | "anonymous_token" | "system";
export type PlatformAuthState = "anonymous" | "authenticated" | "email_unverified" | "expired";
export type PlatformActor = Readonly<{ id: string; type: PlatformActorType; email?: string; emailVerified?: boolean; displayName?: string | null; metadata?: Readonly<Record<string, string | number | boolean | null>> }>;
export type SessionSummary = Readonly<{ actor: PlatformActor; state: PlatformAuthState; sessionId?: string; expiresAt?: string; provider?: string }>;
export type PlatformErrorCode = "anonymous_required" | "authentication_required" | "email_verification_required" | "owner_required" | "scope_denied" | "invalid_token" | "adapter_unavailable";
export type PlatformResult<T> = Readonly<{ ok: true; data: T }> | Readonly<{ ok: false; code: PlatformErrorCode; message: string }>;
export type OwnerScopedResource = Readonly<{ ownerId: string; resourceId?: string; resourceType?: string }>;
export function requireAuthenticatedActor(actor: PlatformActor | null | undefined): PlatformResult<PlatformActor> { return !actor || actor.type === "anonymous_token" ? { ok: false, code: "authentication_required", message: "A signed-in user is required." } : { ok: true, data: actor }; }
export function requireVerifiedEmail(actor: PlatformActor): PlatformResult<PlatformActor> { return actor.emailVerified ? { ok: true, data: actor } : { ok: false, code: "email_verification_required", message: "A verified email address is required." }; }
export function requireOwner(actor: PlatformActor, resource: OwnerScopedResource): PlatformResult<PlatformActor> { return actor.type === "user" && actor.id === resource.ownerId ? { ok: true, data: actor } : { ok: false, code: "owner_required", message: "The current actor does not own this resource." }; }
export type EmailVerificationPort = Readonly<{ send(input: Readonly<{ email: string; redirectTo: string; locale?: string; correlationId?: string }>): Promise<PlatformResult<{ sent: boolean }>>; confirm(input: Readonly<{ tokenHash: string; type: "signup" | "email_change" | "recovery"; redirectTo?: string; correlationId?: string }>): Promise<PlatformResult<SessionSummary>> }>;
export type PlatformEvent = Readonly<{ name: string; occurredAt: string; actor?: PlatformActor; module: string; correlationId?: string; properties?: Readonly<Record<string, string | number | boolean | null>> }>;
export type AnalyticsPort = Readonly<{ track(event: PlatformEvent): Promise<PlatformResult<{ recorded: boolean }>> }>;
export type CapabilityContext = { ownerId: string; featureKey: string; requestId: string };
export type PublicAccessDecision = { allowed: boolean; reason: "ok" | "missing" | "expired" | "revoked" | "scope_mismatch" };
export function decidePublicAccess(input: { present: boolean; expiresAt: string | null; revokedAt: string | null; expectedScope: string; actualScope: string }, now = new Date()) : PublicAccessDecision {
  if (!input.present) return { allowed: false, reason: "missing" };
  if (input.revokedAt) return { allowed: false, reason: "revoked" };
  if (input.expiresAt && new Date(input.expiresAt) <= now) return { allowed: false, reason: "expired" };
  if (input.expectedScope !== input.actualScope) return { allowed: false, reason: "scope_mismatch" };
  return { allowed: true, reason: "ok" };
}
