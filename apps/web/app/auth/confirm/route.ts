import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { productConfig } from "@/config/product.config";
import { normalizeInternalReturn } from "@/modules/platform/navigation/internal-return";
import { hasSupabaseConfig, supabasePublicConfig } from "@/modules/platform/supabase/config";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = normalizeInternalReturn(url.searchParams.get("next"), productConfig.paths.product);
  if (code && hasSupabaseConfig()) {
    const response = NextResponse.redirect(new URL(next, url.origin));
    const config = supabasePublicConfig();
    const client = createServerClient(config.url!, config.key!, { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, headers) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      }
    } });
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return noStore(response);
  }
  return noStore(NextResponse.redirect(new URL(`${productConfig.paths.login}?error=confirmation_failed`, url.origin)));
}
