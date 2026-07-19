import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { hasSupabaseConfig, supabasePublicConfig } from "./config";
import { createSupabaseRouteCookieState } from "./route-cookie-state";

export function createOptionalRouteClient(request: NextRequest) {
  if (!hasSupabaseConfig()) return null;
  const config = supabasePublicConfig();
  const cookieState = createSupabaseRouteCookieState(request.cookies.getAll());
  const client = createServerClient(config.url!, config.key!, { cookies: {
    getAll: cookieState.getAll,
    setAll: cookieState.setAll
  } });
  return { client, applyToResponse: <T extends NextResponse>(response: T) => cookieState.applyToResponse(response) };
}
