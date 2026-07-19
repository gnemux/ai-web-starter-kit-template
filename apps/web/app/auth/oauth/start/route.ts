import { NextResponse, type NextRequest } from "next/server";
import { productConfig } from "@/config/product.config";
import { buildOAuthCallbackUrl, isRecoverableStaleSessionError, isSafeOAuthNavigation, normalizeOAuthProvider } from "@/modules/platform/auth/oauth";
import { getAuthAppUrl } from "@/modules/platform/auth/confirmation-url";
import { getOAuthProviderAvailability } from "@/modules/platform/auth/oauth-provider-settings";
import { normalizeInternalReturn } from "@/modules/platform/navigation/internal-return";
import { createOptionalRouteClient } from "@/modules/platform/supabase/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const provider = normalizeOAuthProvider(request.nextUrl.searchParams.get("provider"));
  if (!provider) return authJson({ available: false }, 400);
  const availability = await getOAuthProviderAvailability(provider);
  return authJson({ available: availability.available });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const provider = normalizeOAuthProvider(form.get("provider"));
  const next = normalizeInternalReturn(String(form.get("next") ?? ""), productConfig.paths.product);
  if (!provider) return authJson({ ok: false, error: "invalid_request" }, 400);
  const availability = await getOAuthProviderAvailability(provider);
  const routeClient = createOptionalRouteClient(request);
  if (!availability.available || !routeClient) return authJson({ ok: false, error: "provider_unavailable" }, 503);
  let appUrl: string;
  try { appUrl = getAuthAppUrl(); }
  catch { return authJson({ ok: false, error: "provider_unavailable" }, 503); }
  let redirectTo: string;
  try { redirectTo = buildOAuthCallbackUrl(appUrl, provider, next, productConfig.paths.product); }
  catch { return authJson({ ok: false, error: "provider_unavailable" }, 503); }
  const { data: sessionData, error: sessionError } = await routeClient.client.auth.getSession();
  if (sessionError && !isRecoverableStaleSessionError(sessionError)) return routeClient.applyToResponse(authJson({ ok: false, error: "provider_unavailable" }, 503));
  if (sessionData.session) {
    const { error } = await routeClient.client.auth.signOut({ scope: "local" });
    if (error) return routeClient.applyToResponse(authJson({ ok: false, error: "provider_unavailable" }, 503));
  }
  const { data, error } = await routeClient.client.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !isSafeOAuthNavigation(data.url)) return routeClient.applyToResponse(authJson({ ok: false, error: "provider_unavailable" }, 503));
  return routeClient.applyToResponse(authJson({ ok: true, provider, url: data.url }));
}

function authJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", Expires: "0" } });
}
