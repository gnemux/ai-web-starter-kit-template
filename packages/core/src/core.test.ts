import assert from "node:assert/strict";
import test from "node:test";
import { assertCatalog, BILLING_SUBSCRIPTION_STATUSES, buildUsageReservation, capabilityAvailable, CREDIT_EVENT_TYPES, historicalReferenceLabel, isActiveRecord, isAiCapability, safeInternalPath } from "./index.ts";

test("safe internal paths reject browser redirect bypasses", () => {
  for (const value of ["https://evil.example", "//evil.example", "/\\evil.example", "/\u0000evil", "javascript:alert(1)"]) assert.equal(safeInternalPath(value, "/login"), "/login");
  assert.equal(safeInternalPath("/product?from=login#top"), "/product?from=login#top");
});

test("capability availability uses the shared state vocabulary", () => {
  assert.equal(capabilityAvailable({ mode: "sandbox", state: "enabled", reason: "safe_adapter" }), true);
  assert.equal(capabilityAvailable({ mode: "external", state: "not_configured", reason: "missing_environment" }), false);
});

test("billing and credit status contracts match the foundation schema vocabulary", () => {
  assert.deepEqual(BILLING_SUBSCRIPTION_STATUSES, ["trialing", "active", "past_due", "canceled", "expired", "refunded"]);
  assert.deepEqual(CREDIT_EVENT_TYPES, ["grant", "reserve", "consume", "release", "refund", "expire", "adjustment"]);
});

test("billing catalog stays product-configured and usage is idempotent", () => {
  assert.doesNotThrow(() => assertCatalog({ plans: [{ id: "starter", name: "Starter", rank: 1, featureKeys: ["export"] }], prices: [{ id: "starter_month", planId: "starter", currency: "usd", amountCents: 900, interval: "month" }] }));
  assert.equal(buildUsageReservation({ ownerId: "u1", featureKey: "export", units: 1, unit: "operation", idempotencyKey: "request:12345678", relatedCreditLedgerId: null, metadata: {} }).status, "reserved");
  assert.equal(isAiCapability("structured"), true);
});

test("archive helpers hide inactive records while preserving historical labels", () => {
  assert.equal(isActiveRecord({ archivedAt: null }), true);
  assert.equal(isActiveRecord({ archivedAt: "2026-07-14T00:00:00Z" }), false);
  assert.equal(historicalReferenceLabel({ currentLabel: null, snapshotLabel: "Original name", wasArchived: true }), "Original name (deleted)");
});
