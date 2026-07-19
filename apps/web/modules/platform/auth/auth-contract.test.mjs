import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { buildEmailConfirmationUrl, buildPasswordRecoveryUrl, getAuthAppUrl } from "./confirmation-url.ts";
import { normalizeInternalReturn } from "../navigation/internal-return.ts";

test("auth surface separates sign in, sign up, reset and profile update", async () => {
  const actions = await readFile(new URL("./actions.ts", import.meta.url), "utf8");
  const submit = await readFile(new URL("./auth-submit-button.tsx", import.meta.url), "utf8");
  const login = await readFile(new URL("../../../app/login/page.tsx", import.meta.url), "utf8");
  assert.match(actions, /export async function signUp/);
  assert.match(actions, /export async function requestPasswordReset/);
  assert.match(actions, /resetPasswordForEmail/);
  assert.match(actions, /export async function updatePassword/);
  assert.match(actions, /auth\.updateUser\(\{ password \}\)/);
  assert.match(actions, /export async function updateProfile/);
  assert.match(login, /mode === "signup" \? "new-password" : "current-password"/);
  assert.match(login, /confirmPassword/);
  assert.match(submit, /useFormStatus/);
  assert.match(submit, /loadingLabel=\{pendingLabel\}/);
  for (const relative of ["../../../app/account/page.tsx", "../../../app/account/billing/page.tsx", "../../../app/account/usage/page.tsx"]) {
    assert.match(await readFile(new URL(relative, import.meta.url), "utf8"), /redirect\(/);
  }
});

test("signup confirmation uses the trusted app origin and a safe local return", () => {
  const safeNext = normalizeInternalReturn("//evil.example", "/product");
  const callback = new URL(buildEmailConfirmationUrl("https://smoke.example/base", safeNext));
  assert.equal(callback.origin, "https://smoke.example");
  assert.equal(callback.pathname, "/auth/confirm");
  assert.equal(callback.searchParams.get("next"), "/product");
  assert.throws(() => buildEmailConfirmationUrl("javascript:alert(1)", "/product"), /Invalid app origin/);
  const previous = { app: process.env.NEXT_PUBLIC_APP_URL, env: process.env.NEXT_PUBLIC_APP_ENV };
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  process.env.NEXT_PUBLIC_APP_ENV = "production";
  assert.throws(() => getAuthAppUrl(), /public app origin/);
  if (previous.app === undefined) delete process.env.NEXT_PUBLIC_APP_URL; else process.env.NEXT_PUBLIC_APP_URL = previous.app;
  if (previous.env === undefined) delete process.env.NEXT_PUBLIC_APP_ENV; else process.env.NEXT_PUBLIC_APP_ENV = previous.env;
});

test("password recovery uses a scanner-safe interstitial before the protected password form", async () => {
  const callback = new URL(buildPasswordRecoveryUrl("http://localhost:3000", "/product"));
  assert.equal(callback.pathname, "/auth/recovery");
  assert.equal(callback.searchParams.get("next"), "/product");
  const confirmation = await readFile(new URL("../../../app/auth/recovery/recovery-confirmation.tsx", import.meta.url), "utf8");
  const actions = await readFile(new URL("./actions.ts", import.meta.url), "utf8");
  const passwordPage = await readFile(new URL("../../../app/auth/recovery/password/page.tsx", import.meta.url), "utf8");
  assert.match(confirmation, /window\.history\.replaceState/);
  assert.match(confirmation, /type === "recovery"/);
  assert.match(actions, /continuePasswordRecovery/);
  assert.match(passwordPage, /!account\.configured \|\| !account\.user/);
});

test("local Supabase allowlist matches generated confirmation callbacks", async () => {
  const config = await readFile(new URL("../../../../../supabase/config.toml", import.meta.url), "utf8");
  for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000"]) {
    const callback = `${origin}/auth/confirm`;
    assert.ok(config.includes(`"${callback}**"`));
    assert.ok(buildEmailConfirmationUrl(origin, "/product").startsWith(`${callback}?next=`));
    assert.ok(config.includes(`"${origin}/auth/recovery**"`));
    assert.ok(config.includes(`"${origin}/auth/oauth/callback**"`));
  }
});

test("recovery routes never initialize product analytics", async () => {
  const instrumentation = await readFile(new URL("../../../instrumentation-client.ts", import.meta.url), "utf8");
  assert.match(instrumentation, /!window\.location\.pathname\.startsWith\("\/auth\/recovery"\)/);
});

test("optional Google OAuth replaces a previous local session and Apple stays deferred", async () => {
  const start = await readFile(new URL("../../../app/auth/oauth/start/route.ts", import.meta.url), "utf8");
  const callback = await readFile(new URL("../../../app/auth/oauth/callback/route.ts", import.meta.url), "utf8");
  const controls = await readFile(new URL("../../../app/login/oauth-options.tsx", import.meta.url), "utf8");
  assert.match(start, /getSession\(\)/);
  assert.match(start, /signOut\(\{ scope: "local" \}\)/);
  assert.match(start, /skipBrowserRedirect: true/);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /identity\.provider === provider/);
  assert.match(callback, /profile\.needsProfile/);
  assert.match(callback, /buildProfileCompletionPath/);
  assert.match(callback, /routeClient\.applyToResponse/);
  assert.match(await readFile(new URL("./current-account.ts", import.meta.url), "utf8"), /invalidateOwnerFact\("account_profile", userId\)/);
  assert.match(start, /function authJson[\s\S]*private, no-store/);
  assert.doesNotMatch(start, /catch \{ return NextResponse\.json/);
  assert.match(controls, /disabled title=\{labels\.appleDeferred\}/);
});

test("confirmation exchange keeps cookies and forbids caching", async () => {
  const route = await readFile(new URL("../../../app/auth/confirm/route.ts", import.meta.url), "utf8");
  for (const contract of ["response.cookies.set(name, value, options)", "Object.entries(headers)", '"Cache-Control", "private, no-store, max-age=0"', '"Pragma", "no-cache"', '"Expires", "0"']) assert.ok(route.includes(contract));
  assert.ok(route.includes("exchangeCodeForSession"));
});

test("invalid persisted sessions are cleared without hiding provider outages", async () => {
  const proxy = await readFile(new URL("../supabase/proxy.ts", import.meta.url), "utf8");
  const middleware = await readFile(new URL("../../../middleware.ts", import.meta.url), "utf8");
  assert.match(middleware, /export async function middleware/);
  assert.match(middleware, /updateSession\(request\)/);
  assert.match(middleware, /runtime: "nodejs"/);
  assert.doesNotMatch(middleware, /export async function proxy/);
  assert.match(proxy, /clearAuthCookiesAtScopes/);
  for (const code of ["bad_jwt", "validation_failed", "user_not_found", "session_not_found", "session_expired", "refresh_token_not_found", "refresh_token_already_used"]) assert.ok(proxy.includes(`"${code}"`));
  assert.match(proxy, /isInvalidStoredSession\(error\)/);
  assert.doesNotMatch(proxy, /request_timeout/);
  assert.match(proxy, /"Cache-Control", "private, no-store, max-age=0"/);
});

test("neutral workspace is server-rendered and does not simulate saved business work", async () => {
  const workspace = await readFile(new URL("../../product/product-workspace.tsx", import.meta.url), "utf8");
  assert.match(workspace, /StatePanel/);
  assert.match(workspace, /resolveCapabilityRegistry/);
  for (const simulated of ["useState", "ProgressBar", "previewWorkflowValue", "interactionConfirmed"]) assert.doesNotMatch(workspace, new RegExp(simulated));
});
