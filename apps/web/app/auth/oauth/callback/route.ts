import { NextResponse, type NextRequest } from "next/server";
import { productConfig } from "@/config/product.config";
import { boundedProviderDisplayName, buildProfileCompletionPath, normalizeOAuthCode, normalizeOAuthProvider } from "@/modules/platform/auth/oauth";
import { ensureAccountProfile } from "@/modules/platform/auth/current-account";
import { normalizeInternalReturn } from "@/modules/platform/navigation/internal-return";
import { createOptionalRouteClient } from "@/modules/platform/supabase/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const provider = normalizeOAuthProvider(request.nextUrl.searchParams.get("provider"));
  const next = normalizeInternalReturn(request.nextUrl.searchParams.get("next"), productConfig.paths.product);
  const failure = request.nextUrl.searchParams.get("error") === "access_denied" ? "cancelled" : "callback_failed";
  if (!provider || request.nextUrl.searchParams.get("error")) return loginFailure(request, failure, next);
  const code = normalizeOAuthCode(request.nextUrl.searchParams.get("code"));
  const routeClient = createOptionalRouteClient(request);
  if (!code || !routeClient) return loginFailure(request, "provider_unavailable", next);
  const { data, error } = await routeClient.client.auth.exchangeCodeForSession(code);
  const user = data.user;
  const expectedIdentity = user?.identities?.some((identity) => identity.provider === provider);
  if (error || !user || !expectedIdentity) return routeClient.applyToResponse(loginFailure(request, "callback_failed", next));
  const profile = await ensureAccountProfile(routeClient.client, user.id, boundedProviderDisplayName(user.user_metadata));
  if (!profile.ok) return routeClient.applyToResponse(loginFailure(request, "provider_unavailable", next));
  if (profile.needsProfile) {
    const completion = buildProfileCompletionPath(productConfig.paths.account, next, productConfig.paths.product);
    return routeClient.applyToResponse(noStoreRedirect(new URL(completion, request.nextUrl.origin)));
  }
  return routeClient.applyToResponse(noStoreRedirect(new URL(next, request.nextUrl.origin)));
}

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function loginFailure(request: NextRequest, error: string, next: string) {
  const url = new URL(productConfig.paths.login, request.nextUrl.origin);
  url.searchParams.set("oauth_error", error);
  url.searchParams.set("next", next);
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
