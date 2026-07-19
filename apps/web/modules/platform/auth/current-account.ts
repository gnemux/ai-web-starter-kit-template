import "server-only";
import { cache } from "react";
import { createOptionalServerClient } from "../supabase/server";
import { cacheOwnerFact, invalidateOwnerFact } from "../performance/cache";

export const getCurrentAccount = cache(async () => {
  const client = await createOptionalServerClient();
  if (!client) return { configured: false as const, user: null };
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { configured: true as const, user: null, profile: null };
  const profile = await cacheOwnerFact("account_profile", data.user.id, async () => {
    const { data: value } = await client.from("user_profiles").select("display_name, avatar_url").eq("id", data.user.id).maybeSingle();
    return value;
  });
  return { configured: true as const, user: data.user, profile };
});

export async function ensureAccountProfile(client: NonNullable<Awaited<ReturnType<typeof createOptionalServerClient>>>, userId: string, displayName: string | null) {
  const { data, error } = await client.from("user_profiles").upsert({ id: userId }, { onConflict: "id" }).select("display_name, avatar_url").single();
  if (error) return { ok: false as const };
  if (!data.display_name && displayName) {
    const { error: updateError } = await client.from("user_profiles").update({ display_name: displayName }).eq("id", userId).is("display_name", null);
    if (updateError) return { ok: false as const };
  }
  invalidateOwnerFact("account_profile", userId);
  return { ok: true as const, needsProfile: !data.display_name && !displayName };
}
