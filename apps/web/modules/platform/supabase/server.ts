import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasSupabaseConfig, supabasePublicConfig } from "./config";

export async function createOptionalServerClient() {
  if (!hasSupabaseConfig()) return null;
  const config = supabasePublicConfig();
  const store = await cookies();
  return createServerClient(config.url!, config.key!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => { try { values.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Proxy owns cookie/header writes for Server Components. */ } }
    }
  });
}
