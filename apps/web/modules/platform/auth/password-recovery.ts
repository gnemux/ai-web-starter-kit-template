import { normalizeInternalReturn } from "../navigation/internal-return.ts";

export function normalizeRecoveryEmail(value: FormDataEntryValue | null) {
  const email = String(value ?? "").trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function normalizeRecoveryTokenHash(value: FormDataEntryValue | null) {
  const tokenHash = typeof value === "string" ? value : "";
  return tokenHash.length >= 32 && tokenHash.length <= 512 && /^[A-Za-z0-9._~-]+$/.test(tokenHash) ? tokenHash : null;
}

export function normalizeRecoveryNext(value: FormDataEntryValue | string | null | undefined, fallback: string) {
  return normalizeInternalReturn(String(value ?? ""), fallback);
}

export function validateRecoveredPassword(passwordValue: FormDataEntryValue | null, confirmationValue: FormDataEntryValue | null) {
  const password = String(passwordValue ?? "");
  const confirmation = String(confirmationValue ?? "");
  if (password.length < 8) return { ok: false as const, error: "password_invalid" as const };
  if (confirmation !== password) return { ok: false as const, error: "password_mismatch" as const };
  return { ok: true as const, password };
}
