export type BillingPlanId = string;
export type BillingPriceId = string;
export type BillingFeatureKey = string;
export type BillingCatalog = {
  plans: Array<{ id: BillingPlanId; name: string; rank: number; featureKeys: BillingFeatureKey[] }>;
  prices: Array<{ id: BillingPriceId; planId: BillingPlanId; currency: string; amountCents: number; interval: "month" | "year" }>;
};
export const BILLING_SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "canceled", "expired", "refunded"] as const;
export const CREDIT_EVENT_TYPES = ["grant", "reserve", "consume", "release", "refund", "expire", "adjustment"] as const;
export type BillingSubscription = { id: string; ownerId: string; provider: string; providerSubscriptionId: string | null; planId: string; priceId: string; status: typeof BILLING_SUBSCRIPTION_STATUSES[number]; currentPeriodStart: string | null; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; metadata: Record<string, unknown> };
export type BillingEntitlement = { id: string; ownerId: string; sourceType: string; sourceId: string | null; featureKey: string; allowanceKind: "boolean" | "quantity"; quantity: number | null; quantityUsed: number; unit: string | null; status: "active" | "expired" | "revoked"; renewsAt: string | null; expiresAt: string | null; metadata: Record<string, unknown> };
export type CreditLedgerEntry = { ownerId: string; entitlementId: string | null; eventType: typeof CREDIT_EVENT_TYPES[number]; amount: number; unit: string; idempotencyKey: string; sourceType: string; sourceId: string | null; reason: string | null; metadata: Record<string, unknown> };
export type UsageLedgerEntry = { ownerId: string; featureKey: string; units: number; unit: string; status: "reserved" | "committed" | "released" | "failed"; idempotencyKey: string; relatedCreditLedgerId: string | null; metadata: Record<string, unknown> };

export function assertCatalog(catalog: BillingCatalog) {
  const plans = new Set(catalog.plans.map((plan) => plan.id));
  if (plans.size !== catalog.plans.length || catalog.prices.some((price) => !plans.has(price.planId) || price.amountCents < 0 || !/^[a-z]{3}$/.test(price.currency))) throw new Error("Invalid billing catalog");
  return catalog;
}
export function hasEntitlement(entitlements: BillingEntitlement[], featureKey: string) {
  return entitlements.some((entry) => entry.featureKey === featureKey && entry.status === "active" && (entry.allowanceKind === "boolean" || (entry.quantity ?? 0) > entry.quantityUsed));
}
export function assertIdempotencyKey(value: string) {
  if (!/^[A-Za-z0-9:_-]{8,160}$/.test(value)) throw new Error("Invalid idempotency key");
  return value;
}
export function buildUsageReservation(input: Omit<UsageLedgerEntry, "status">): UsageLedgerEntry {
  if (input.units <= 0) throw new Error("Usage units must be positive");
  assertIdempotencyKey(input.idempotencyKey);
  return { ...input, status: "reserved" };
}
