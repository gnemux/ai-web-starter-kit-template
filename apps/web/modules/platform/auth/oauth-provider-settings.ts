import "server-only";
import { supabasePublicConfig } from "../supabase/config";
import type { SocialOAuthProvider } from "./oauth";

const cache = new Map<SocialOAuthProvider, { enabled: boolean; expiresAt: number }>();
const cacheTtlMs = 5 * 60_000;
const timeoutMs = 3_000;

export async function getOAuthProviderAvailability(provider: SocialOAuthProvider) {
  const cached = cache.get(provider);
  if (cached && cached.expiresAt > Date.now()) return { available: cached.enabled, configured: true };
  const config = supabasePublicConfig();
  if (!config.url || !config.key) return { available: false, configured: false };
  try {
    const response = await fetch(new URL("/auth/v1/settings", config.url), {
      cache: "no-store",
      headers: { apikey: config.key },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) return { available: false, configured: true };
    const payload = await response.json() as { external?: Record<string, unknown> };
    const available = payload.external?.[provider] === true;
    cache.set(provider, { enabled: available, expiresAt: Date.now() + cacheTtlMs });
    return { available, configured: true };
  } catch {
    return { available: false, configured: true };
  }
}
