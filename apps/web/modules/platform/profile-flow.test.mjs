import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("profile update is an in-place server mutation with precise cache invalidation", async () => {
  const action = await readFile(new URL("./auth/actions.ts", import.meta.url), "utf8");
  const form = await readFile(new URL("../../app/account/profile-form.tsx", import.meta.url), "utf8");
  assert.match(action, /invalidateOwnerFact\("account_profile"/);
  assert.match(action, /revalidatePath\(productConfig\.paths\.account\)/);
  const updateBody = action.slice(action.indexOf("export async function updateProfile"), action.indexOf("export async function signOut"));
  assert.doesNotMatch(updateBody, /redirect\(/);
  assert.match(form, /useActionState\(updateProfile/);
  assert.doesNotMatch(form, /display-name-error.*aria-describedby/);
  assert.doesNotMatch(form, /window\.location|location\.reload/);
});
