import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { buildEmailConfirmationUrl } from "./confirmation-url.ts";
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
});

test("password recovery returns only to the protected password form", () => {
  const callback = new URL(buildEmailConfirmationUrl("http://localhost:3000", "/account?mode=update-password"));
  assert.equal(callback.pathname, "/auth/confirm");
  assert.equal(callback.searchParams.get("next"), "/account?mode=update-password");
});

test("local Supabase allowlist matches generated confirmation callbacks", async () => {
  const config = await readFile(new URL("../../../../../supabase/config.toml", import.meta.url), "utf8");
  for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000"]) {
    const callback = `${origin}/auth/confirm`;
    assert.ok(config.includes(`"${callback}**"`));
    assert.ok(buildEmailConfirmationUrl(origin, "/product").startsWith(`${callback}?next=`));
  }
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
