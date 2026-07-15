import type { BillingCatalog } from "./billing.ts";
import { assertCatalog, assertIdempotencyKey } from "./billing.ts";

export type CheckoutRequest = { ownerId: string; priceId: string; successUrl: string; cancelUrl: string; idempotencyKey: string };
export type CheckoutResult = { provider: string; checkoutSessionId: string; checkoutUrl: string; expiresAt: string | null };
export type PaymentWebhook = { provider: string; eventId: string; eventType: string; occurredAt: string; payload: unknown };
export type PaymentAnalyticsEvent = "checkout_started" | "checkout_completed" | "checkout_failed";

export function validateCheckout(request: CheckoutRequest, catalog: BillingCatalog) {
  assertCatalog(catalog);
  assertIdempotencyKey(request.idempotencyKey);
  if (!catalog.prices.some((price) => price.id === request.priceId)) throw new Error("Unknown price");
  return request;
}
