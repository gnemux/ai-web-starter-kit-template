import { normalizeInternalReturn } from "../navigation/internal-return.ts";

export type SocialOAuthProvider = "google";

const RECOVERABLE_STALE_SESSION_CODES = new Set([
  "refresh_token_already_used",
  "refresh_token_not_found",
  "session_not_found"
]);

export function normalizeOAuthProvider(value: FormDataEntryValue | string | null | undefined): SocialOAuthProvider | null {
  return String(value ?? "").trim().toLowerCase() === "google" ? "google" : null;
}

export function normalizeOAuthCode(value: string | null | undefined) {
  const code = String(value ?? "");
  return code.length >= 16 && code.length <= 2048 && /^[A-Za-z0-9._~-]+$/.test(code) ? code : null;
}

export function buildOAuthCallbackUrl(appUrl: string, provider: SocialOAuthProvider, nextValue: string, fallback: string) {
  const origin = new URL(appUrl);
  if (!(["http:", "https:"] as string[]).includes(origin.protocol) || origin.username || origin.password) throw new Error("Invalid app origin");
  const callback = new URL("/auth/oauth/callback", origin.origin);
  callback.searchParams.set("provider", provider);
  callback.searchParams.set("next", normalizeInternalReturn(nextValue, fallback));
  return callback.toString();
}

export function isSafeOAuthNavigation(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    return url.protocol === "https:" || (url.protocol === "http:" && loopback);
  } catch {
    return false;
  }
}

export function buildProfileCompletionPath(accountPath: string, nextValue: string, fallback: string) {
  const search = new URLSearchParams({ complete_profile: "1", next: normalizeInternalReturn(nextValue, fallback) });
  return `${accountPath}?${search.toString()}`;
}

export function isRecoverableStaleSessionError(error: { code?: string } | null) {
  return Boolean(error?.code && RECOVERABLE_STALE_SESSION_CODES.has(error.code));
}

export function boundedProviderDisplayName(metadata: Record<string, unknown> | undefined) {
  for (const key of ["full_name", "name"]) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim().length > 0 && value.trim().length <= 80) return value.trim();
  }
  return null;
}
