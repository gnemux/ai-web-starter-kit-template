import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sql = await readFile(path.join(root, "supabase/migrations/20260713155439_foundation_baseline.sql"), "utf8");
const tables = ["user_profiles", "billing_orders", "billing_subscriptions", "billing_entitlements", "billing_credit_ledger", "billing_usage_ledger", "payment_events"];
for (const table of tables) {
  if (!sql.includes(`alter table public.${table} enable row level security`)) throw new Error(`RLS missing for ${table}`);
  if (!sql.includes(`grant all on table public.${table} to service_role`)) throw new Error(`Service role grant missing for ${table}`);
}
for (const table of tables.slice(0, 6)) if (!sql.includes(`owner_read_${table}`)) throw new Error(`Owner read policy missing for ${table}`);
if (!/create policy owner_insert_user_profiles[\s\S]+with check \(auth\.uid\(\) = id\)/.test(sql)) throw new Error("Profile insert ownership guard missing");
if (!/create policy owner_update_user_profiles[\s\S]+using \(auth\.uid\(\) = id\)[\s\S]+with check \(auth\.uid\(\) = id\)/.test(sql)) throw new Error("Profile update transfer guard missing");
if (/create policy[^;]+payment_events/i.test(sql)) throw new Error("Payment events must have no public policy");
if (!sql.includes("set search_path = ''") || !sql.includes("revoke execute on function public.set_updated_at() from public, anon, authenticated")) throw new Error("Trigger function hardening missing");
for (const required of ["idempotency_key", "related_credit_ledger_id", "source_type", "source_id", "metadata", "reserved", "committed", "released", "failed"]) if (!sql.includes(required)) throw new Error(`Foundation semantics missing: ${required}`);
for (const table of ["billing_orders", "billing_subscriptions", "billing_entitlements", "billing_credit_ledger", "billing_usage_ledger"]) {
  const tableSql = sql.slice(sql.indexOf(`create table public.${table}`), sql.indexOf(");", sql.indexOf(`create table public.${table}`)) + 2);
  if (!/owner_id uuid not null references auth\.users\(id\) on delete restrict/.test(tableSql)) throw new Error(`Immutable billing facts must restrict auth-user deletion: ${table}`);
}
const billingContract = await readFile(path.join(root, "packages/core/src/billing.ts"), "utf8");
for (const status of ["trialing", "active", "past_due", "canceled", "expired", "refunded"]) if (!billingContract.includes(`\"${status}\"`) || !sql.includes(`'${status}'`)) throw new Error(`Subscription status contract drift: ${status}`);
for (const eventType of ["grant", "reserve", "consume", "release", "refund", "expire", "adjustment"]) if (!billingContract.includes(`\"${eventType}\"`) || !sql.includes(`'${eventType}'`)) throw new Error(`Credit event contract drift: ${eventType}`);
if (!billingContract.includes("providerSubscriptionId: string | null") || !/provider_subscription_id text[,\n]/.test(sql)) throw new Error("Subscription provider id nullability contract drift");
if (!billingContract.includes("priceId: string;") || !/price_id text not null/.test(sql)) throw new Error("Subscription price id nullability contract drift");
const ignores = await readFile(path.join(root, ".gitignore"), "utf8");
for (const expected of ["node_modules/", ".next/", ".turbo/", ".vercel/", "test-results/", "playwright-report/", ".env.*"]) if (!ignores.includes(expected)) throw new Error(`Repository hygiene ignore missing: ${expected}`);
if (existsSync(path.join(root, ".git"))) {
  const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
  for (const file of tracked) if (/(?:^|\/)\.env(?:\..+)?$/.test(file) && !file.endsWith(".env.example") || /(?:^|\/)(?:\.vercel|node_modules|\.next|\.turbo|test-results|playwright-report)(?:\/|$)/.test(file)) throw new Error(`Private or generated path must not be tracked: ${file}`);
}
const config = await readFile(path.join(root, "apps/web/next.config.ts"), "utf8");
for (const header of ["frame-ancestors 'none'", "Referrer-Policy", "X-Content-Type-Options", "Permissions-Policy"]) if (!config.includes(header)) throw new Error(`Security header missing: ${header}`);
if (!config.includes('process.env.NODE_ENV === "development"') || !config.includes(': "script-src \'self\' \'unsafe-inline\'"')) throw new Error("Production CSP must exclude unsafe-eval");
const proxy = await readFile(path.join(root, "apps/web/modules/platform/supabase/proxy.ts"), "utf8");
for (const cookieContract of ["request.cookies.getAll()", "response.cookies.set(name, value, options)", "Object.entries(headers)", "client.auth.getClaims()"] ) if (!proxy.includes(cookieContract)) throw new Error(`Session cookie refresh contract missing: ${cookieContract}`);
const middleware = await readFile(path.join(root, "apps/web/middleware.ts"), "utf8");
if (!middleware.includes("export async function middleware") || !middleware.includes("updateSession(request)") || !middleware.includes('runtime: "nodejs"')) throw new Error("Locked Next.js 15 Node session middleware entry is missing");
const supabaseConfig = await readFile(path.join(root, "apps/web/modules/platform/supabase/config.ts"), "utf8");
if (!supabaseConfig.includes("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") || !supabaseConfig.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY")) throw new Error("Publishable-key preference and legacy fallback must both be explicit");
const analyticsProperties = await readFile(path.join(root, "apps/web/modules/platform/analytics/properties.ts"), "utf8");
for (const boundary of ["autocapture: false", "capture_pageview: false", "capture_pageleave: false", "disable_session_recording: true"]) if (!analyticsProperties.includes(boundary)) throw new Error(`Analytics automatic collection must stay disabled: ${boundary}`);
console.log("Security and foundation SQL boundaries verified");
