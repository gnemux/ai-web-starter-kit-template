import assert from "node:assert/strict";
import test from "node:test";
import { normalizeInternalReturn } from "./internal-return.ts";

test("return paths remain same-origin", () => {
  for (const input of ["https://evil.example", "//evil.example", "/\\evil.example", "/\u0007evil", "javascript:alert(1)"]) assert.equal(normalizeInternalReturn(input, "/login"), "/login");
  assert.equal(normalizeInternalReturn("/account?ready=1#profile"), "/account?ready=1#profile");
});

test("the app navigation helper delegates to the shared core implementation", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("./internal-return.ts", import.meta.url), "utf8"));
  assert.match(source, /safeInternalPath as normalizeInternalReturn/);
  assert.doesNotMatch(source, /new URL\(/);
});
