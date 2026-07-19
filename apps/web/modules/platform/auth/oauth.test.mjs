import assert from "node:assert/strict";
import test from "node:test";
import { boundedProviderDisplayName, buildOAuthCallbackUrl, buildProfileCompletionPath, isRecoverableStaleSessionError, isSafeOAuthNavigation, normalizeOAuthCode, normalizeOAuthProvider } from "./oauth.ts";

test("OAuth contract permits only Google and safe callback values", () => {
  assert.equal(normalizeOAuthProvider("google"), "google");
  assert.equal(normalizeOAuthProvider("apple"), null);
  assert.equal(normalizeOAuthCode("a".repeat(16)), "a".repeat(16));
  assert.equal(normalizeOAuthCode("bad code"), null);
  const callback = new URL(buildOAuthCallbackUrl("https://product.example/base", "google", "//evil.example", "/product"));
  assert.equal(callback.pathname, "/auth/oauth/callback");
  assert.equal(callback.searchParams.get("next"), "/product");
  assert.equal(isSafeOAuthNavigation("https://accounts.google.com/o/oauth2/auth"), true);
  assert.equal(isSafeOAuthNavigation("http://localhost:54321/auth/v1/authorize"), true);
  assert.equal(isSafeOAuthNavigation("ftp://localhost/unsafe"), false);
  assert.equal(isSafeOAuthNavigation("javascript:alert(1)"), false);
  assert.equal(isRecoverableStaleSessionError({ code: "refresh_token_not_found" }), true);
  assert.equal(isRecoverableStaleSessionError({ code: "refresh_token_already_used" }), true);
  assert.equal(isRecoverableStaleSessionError({ code: "session_not_found" }), true);
  assert.equal(isRecoverableStaleSessionError({ code: "request_timeout" }), false);
  assert.equal(boundedProviderDisplayName({ full_name: " Example Person " }), "Example Person");
  assert.equal(buildProfileCompletionPath("/account", "//evil.example", "/product"), "/account?complete_profile=1&next=%2Fproduct");
});
