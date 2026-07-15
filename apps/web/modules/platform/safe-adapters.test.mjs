import assert from "node:assert/strict";
import test from "node:test";
import { createMockAiDraft } from "./ai/mock.ts";
import { createSandboxCheckoutIntent } from "./payment/sandbox.ts";

test("payment sandbox creates a deterministic no-side-effect intent", () => {
  assert.deepEqual(createSandboxCheckoutIntent({ idempotencyKey: "checkout:test", currency: "usd", amountCents: 0 }), { provider: "sandbox", idempotencyKey: "checkout:test", currency: "usd", amountCents: 0, status: "requires_confirmation", externalSideEffect: false });
  assert.throws(() => createSandboxCheckoutIntent({ idempotencyKey: "short", currency: "USD", amountCents: -1 }));
});

test("AI mock is deterministic, non-billable and rejects free-form content", () => {
  assert.deepEqual(createMockAiDraft("product_onboarding"), createMockAiDraft("product_onboarding"));
  assert.equal(createMockAiDraft("product_onboarding").billable, false);
  assert.throws(() => createMockAiDraft("private free form prompt"));
});
