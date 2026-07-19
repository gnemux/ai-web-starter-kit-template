import assert from "node:assert/strict";
import test from "node:test";
import { createSupabaseRouteCookieState } from "./route-cookie-state.ts";

test("route cookie state replaces old auth cookies on the exact response", () => {
  const state = createSupabaseRouteCookieState([{ name: "old", value: "session" }]);
  state.setAll([
    { name: "old", value: "", options: { path: "/", maxAge: 0 } },
    { name: "new", value: "google-session", options: { path: "/", httpOnly: true } }
  ], { "x-supabase-auth": "refreshed" });
  const cookies = [];
  const response = { headers: new Headers(), cookies: { set: (...args) => cookies.push(args) } };
  state.applyToResponse(response);
  assert.deepEqual(state.getAll(), [{ name: "new", value: "google-session" }]);
  assert.equal(cookies.length, 2);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("x-supabase-auth"), "refreshed");
});
