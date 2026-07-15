import { clearAuthCookiesAtScopes, createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig, supabasePublicConfig } from "./config";

const invalidStoredSessionCodes = new Set([
  "bad_jwt",
  "validation_failed",
  "user_not_found",
  "session_not_found",
  "session_expired",
  "refresh_token_not_found",
  "refresh_token_already_used"
]);

function isInvalidStoredSession(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && typeof error.code === "string" && invalidStoredSessionCodes.has(error.code)) return true;
  return "__isAuthError" in error && error.__isAuthError === true && "status" in error && error.status === 400;
}

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseConfig()) return NextResponse.next({ request });
  const config = supabasePublicConfig();
  const storageKey = `sb-${new URL(config.url!).hostname.split(".")[0]}-auth-token`;
  const storedCookies = request.cookies.getAll();
  const hasStoredSession = storedCookies.some(({ name }) => name === storageKey || name.startsWith(`${storageKey}.`));
  let response = NextResponse.next({ request });
  const client = createServerClient(config.url!, config.key!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, headers) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      }
    }
  });
  const { error } = await client.auth.getClaims();
  if (hasStoredSession && isInvalidStoredSession(error)) {
    await clearAuthCookiesAtScopes({
      getAll: () => storedCookies,
      storageKey,
      scopes: [{ path: "/" }],
      setAll: (values, headers) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      }
    });
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
  }
  return response;
}
