export function supabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const legacyAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return { url, key: publishableKey || legacyAnonKey, usingLegacyAnonKey: !publishableKey && Boolean(legacyAnonKey) };
}

export function hasSupabaseConfig() {
  const config = supabasePublicConfig();
  return Boolean(config.url && config.key);
}
