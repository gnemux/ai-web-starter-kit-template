import assert from "node:assert/strict";
import test from "node:test";
import { createOwnerScope, defineSchemaVersion, formatSchemaVersion } from "./index.ts";

test("database contracts keep owner scope and schema evidence provider-free", () => {
  assert.equal(createOwnerScope("owner-a", "owner-b").ok, false);
  assert.deepEqual(createOwnerScope("owner-a", "owner-a"), { ok: true, data: { actorId: "owner-a", ownerId: "owner-a", policy: "owner-only" } });
  assert.equal(formatSchemaVersion(defineSchemaVersion("foundation-v1", "baseline", "2026-07-14")), "foundation-v1 @ 2026-07-14");
});
