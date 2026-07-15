import type { BillingEntitlement } from "./billing.ts";
import { assertIdempotencyKey, hasEntitlement } from "./billing.ts";

export type AiCapability = "text" | "structured" | "embedding";
export type AiServiceReason = "disabled" | "not_configured" | "not_entitled" | "budget_exceeded" | "provider_error";
export type AiRequest = { capability: AiCapability; input: string; idempotencyKey: string; maxOutputTokens: number; featureKey: string };
export type AiModel = { id: string; capabilities: AiCapability[]; inputCostPerMillion: number; outputCostPerMillion: number };
export type AiAnalyticsEvent = "ai_requested" | "ai_succeeded" | "ai_failed";

export function isAiCapability(value: string): value is AiCapability { return ["text", "structured", "embedding"].includes(value); }
export function normalizeAiInput(value: string) { return value.trim().replace(/\s+/g, " ").slice(0, 16_000); }
export function preflightAiRequest(request: AiRequest, entitlements: BillingEntitlement[], budgetLimit: number) {
  assertIdempotencyKey(request.idempotencyKey);
  if (!isAiCapability(request.capability) || !hasEntitlement(entitlements, request.featureKey)) return { ok: false as const, reason: "not_entitled" as const };
  if (request.maxOutputTokens <= 0 || request.maxOutputTokens > budgetLimit) return { ok: false as const, reason: "budget_exceeded" as const };
  return { ok: true as const };
}
export function resolveAiModel(models: AiModel[], capability: AiCapability) { return models.find((model) => model.capabilities.includes(capability)) ?? null; }
