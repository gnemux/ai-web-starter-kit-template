"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { productConfig } from "@/config/product.config";
import { normalizeInternalReturn } from "../navigation/internal-return";
import { createOptionalServerClient } from "../supabase/server";
import { invalidateOwnerFact } from "../performance/cache";
import { buildEmailConfirmationUrl, buildPasswordRecoveryUrl, getAuthAppUrl } from "./confirmation-url";
import { normalizeRecoveryEmail, normalizeRecoveryNext, normalizeRecoveryTokenHash, validateRecoveredPassword } from "./password-recovery";

type LoginMode = "signin" | "signup" | "reset";
function loginLocation(input: { mode?: LoginMode; next?: string; error?: string; message?: string } = {}) {
  const search = new URLSearchParams();
  if (input.mode && input.mode !== "signin") search.set("mode", input.mode);
  if (input.next) search.set("next", input.next);
  if (input.error) search.set("error", input.error);
  if (input.message) search.set("message", input.message);
  const query = search.toString();
  return `${productConfig.paths.login}${query ? `?${query}` : ""}`;
}

export async function signIn(formData: FormData) {
  const client = await createOptionalServerClient();
  if (!client) redirect(loginLocation({ error: "not_configured" }));
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = normalizeInternalReturn(String(formData.get("next") ?? ""), productConfig.paths.product);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) redirect(loginLocation({ next, error: "invalid_credentials" }));
  revalidatePath(productConfig.paths.home);
  revalidatePath(productConfig.paths.account);
  redirect(next);
}

export async function signUp(formData: FormData) {
  const client = await createOptionalServerClient();
  if (!client) redirect(loginLocation({ mode: "signup", error: "not_configured" }));
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const next = normalizeInternalReturn(String(formData.get("next") ?? ""), productConfig.paths.product);
  if (!email || password.length < 8 || password !== confirmPassword) redirect(loginLocation({ mode: "signup", next, error: "invalid_signup" }));
  let emailRedirectTo: string;
  try { emailRedirectTo = buildEmailConfirmationUrl(getAuthAppUrl(), next); }
  catch { redirect(loginLocation({ mode: "signup", next, error: "invalid_app_url" })); }
  const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo } });
  if (error) redirect(loginLocation({ mode: "signup", next, error: "signup_failed" }));
  if (!data.session) redirect(loginLocation({ next, message: "check_email" }));
  revalidatePath(productConfig.paths.home);
  redirect(next);
}

export async function requestPasswordReset(formData: FormData) {
  const client = await createOptionalServerClient();
  if (!client) redirect(loginLocation({ mode: "reset", error: "not_configured" }));
  const email = normalizeRecoveryEmail(formData.get("email"));
  const next = normalizeRecoveryNext(formData.get("next"), productConfig.paths.product);
  if (!email) redirect(loginLocation({ mode: "reset", next, error: "reset_failed" }));
  let redirectTo: string;
  try { redirectTo = buildPasswordRecoveryUrl(getAuthAppUrl(), next); }
  catch { redirect(loginLocation({ mode: "reset", next, error: "reset_failed" })); }
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) redirect(loginLocation({ mode: "reset", next, error: "reset_failed" }));
  redirect(loginLocation({ mode: "reset", next, message: "reset_requested" }));
}

export type RecoveryContinuationState = { ok: false; error: "invalid_recovery" } | null;

export async function continuePasswordRecovery(_state: RecoveryContinuationState, formData: FormData): Promise<RecoveryContinuationState> {
  const client = await createOptionalServerClient();
  const tokenHash = normalizeRecoveryTokenHash(formData.get("tokenHash"));
  const next = normalizeRecoveryNext(formData.get("next"), productConfig.paths.product);
  if (!client || !tokenHash) return { ok: false, error: "invalid_recovery" };
  const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
  if (error) return { ok: false, error: "invalid_recovery" };
  redirect(`/auth/recovery/password?next=${encodeURIComponent(next)}`);
}

export type RecoveredPasswordState =
  | { ok: false; error: "password_invalid" | "password_mismatch" | "password_update_failed" }
  | { ok: true; next: string }
  | null;

export async function updateRecoveredPassword(_state: RecoveredPasswordState, formData: FormData): Promise<RecoveredPasswordState> {
  const input = validateRecoveredPassword(formData.get("password"), formData.get("confirmPassword"));
  if (!input.ok) return input;
  const client = await createOptionalServerClient();
  if (!client) return { ok: false, error: "password_update_failed" };
  const { data, error: userError } = await client.auth.getUser();
  if (userError || !data.user) return { ok: false, error: "password_update_failed" };
  const { error } = await client.auth.updateUser({ password: input.password });
  if (error) return { ok: false, error: "password_update_failed" };
  revalidatePath(productConfig.paths.account);
  return { ok: true, next: normalizeRecoveryNext(formData.get("next"), productConfig.paths.product) };
}

export async function updatePassword(formData: FormData) {
  const client = await createOptionalServerClient();
  if (!client) redirect(loginLocation({ error: "not_configured" }));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (password.length < 8 || password !== confirmPassword) redirect(`${productConfig.paths.account}?mode=update-password&error=password_invalid`);
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) redirect(loginLocation({ mode: "reset", error: "reset_failed" }));
  const { error } = await client.auth.updateUser({ password });
  if (error) redirect(`${productConfig.paths.account}?mode=update-password&error=password_update_failed`);
  revalidatePath(productConfig.paths.account);
  redirect(`${productConfig.paths.account}?message=password_updated`);
}

export type ProfileActionState = { status: "idle" | "success" | "error"; message: string };

export async function updateProfile(_previous: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const client = await createOptionalServerClient();
  if (!client) return { status: "error", message: "not_configured" };
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { status: "error", message: "not_authenticated" };
  const displayName = String(formData.get("displayName") ?? "").trim();
  const requiresDisplayName = formData.get("requireDisplayName") === "1";
  if (displayName.length > 120 || (requiresDisplayName && !displayName)) return { status: "error", message: "invalid_profile" };
  const { error: profileError } = await client.from("user_profiles").upsert({ id: data.user.id, display_name: displayName || null }, { onConflict: "id" });
  if (profileError) return { status: "error", message: "profile_update_failed" };
  invalidateOwnerFact("account_profile", data.user.id);
  revalidatePath(productConfig.paths.account);
  return { status: "success", message: "profile_saved" };
}

export async function signOut() {
  const client = await createOptionalServerClient();
  if (client) await client.auth.signOut();
  revalidatePath(productConfig.paths.home);
  redirect(productConfig.paths.home);
}
