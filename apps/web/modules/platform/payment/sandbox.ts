export type SandboxCheckoutIntent = Readonly<{ provider: "sandbox"; idempotencyKey: string; currency: string; amountCents: number; status: "requires_confirmation"; externalSideEffect: false }>;

export function createSandboxCheckoutIntent(input: { idempotencyKey: string; currency: string; amountCents: number }): SandboxCheckoutIntent {
  if (!/^[A-Za-z0-9:_-]{8,160}$/.test(input.idempotencyKey)) throw new TypeError("Sandbox idempotency key is invalid");
  if (!/^[a-z]{3}$/.test(input.currency) || !Number.isInteger(input.amountCents) || input.amountCents < 0) throw new TypeError("Sandbox amount is invalid");
  return { provider: "sandbox", idempotencyKey: input.idempotencyKey, currency: input.currency, amountCents: input.amountCents, status: "requires_confirmation", externalSideEffect: false };
}
