import assert from "node:assert/strict";
import test from "node:test";
import { ownerCacheTag } from "./cache-key.ts";

test("owner cache tags are deterministic, bounded and scoped", () => {
  assert.equal(ownerCacheTag("billing", "owner-1"), ownerCacheTag("billing", "owner-1"));
  assert.notEqual(ownerCacheTag("billing", "owner-1"), ownerCacheTag("billing", "owner-2"));
  assert.throws(() => ownerCacheTag("*", "owner-1"));
  assert.throws(() => ownerCacheTag("billing", "owner/1"));
});
