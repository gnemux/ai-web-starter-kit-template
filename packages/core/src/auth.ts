export type AuthCredentials = { email: string; password: string };
export type UserProfile = { id: string; email: string | null; displayName: string | null; createdAt: string; updatedAt: string };
export type AuthAnalyticsEvent = "user_signed_up" | "user_logged_in" | "user_logged_out";

export function safeInternalPath(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return fallback;
  const origin = "https://app.invalid";
  try {
    const resolved = new URL(value, origin);
    return resolved.origin === origin ? `${resolved.pathname}${resolved.search}${resolved.hash}` : fallback;
  } catch {
    return fallback;
  }
}

export const normalizeReturnPath = safeInternalPath;
