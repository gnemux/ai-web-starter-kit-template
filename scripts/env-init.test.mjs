import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { initializeEnvironment } from "./env-init.mjs";

test("environment initialization targets the Next app and never overwrites local values", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "candidate-env-"));
  try {
    await mkdir(path.join(root, "apps/web"), { recursive: true });
    await writeFile(path.join(root, ".env.example"), "NEXT_PUBLIC_SUPABASE_URL=\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=\n");
    const first = await initializeEnvironment({ root, localSupabase: true, status: { API_URL: "http://127.0.0.1:55321", PUBLISHABLE_KEY: "local-public-test-key" } });
    assert.equal(first.created, true);
    assert.equal(first.target, path.join(root, "apps/web/.env.local"));
    const configured = await readFile(first.target, "utf8");
    assert.match(configured, /NEXT_PUBLIC_SUPABASE_URL=http:\/\/127\.0\.0\.1:55321/);
    assert.match(configured, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-public-test-key/);
    await writeFile(first.target, "LOCAL_ONLY=kept\n");
    const second = await initializeEnvironment({ root });
    assert.equal(second.created, false);
    assert.equal(await readFile(first.target, "utf8"), "LOCAL_ONLY=kept\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
