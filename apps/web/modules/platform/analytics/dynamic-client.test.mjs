import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("disabled analytics does not statically load the PostHog browser SDK", async () => {
  const source = await readFile(new URL("./client.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /import posthog from/);
  assert.match(source, /import\("posthog-js"\)/);
  assert.match(source, /capabilities\.analytics\) !== "external"/);
});
