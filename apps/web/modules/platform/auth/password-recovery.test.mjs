import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRecoveryEmail, normalizeRecoveryNext, normalizeRecoveryTokenHash, validateRecoveredPassword } from "./password-recovery.ts";

test("password recovery validates bounded email, token and safe return", () => {
  assert.equal(normalizeRecoveryEmail(" Person@Example.com "), "person@example.com");
  assert.equal(normalizeRecoveryEmail("invalid"), null);
  assert.equal(normalizeRecoveryTokenHash("a".repeat(32)), "a".repeat(32));
  assert.equal(normalizeRecoveryTokenHash("unsafe token"), null);
  assert.equal(normalizeRecoveryNext("//evil.example", "/product"), "/product");
  assert.deepEqual(validateRecoveredPassword("12345678", "12345678"), { ok: true, password: "12345678" });
  assert.deepEqual(validateRecoveredPassword("short", "short"), { ok: false, error: "password_invalid" });
  assert.deepEqual(validateRecoveredPassword("12345678", "87654321"), { ok: false, error: "password_mismatch" });
});
