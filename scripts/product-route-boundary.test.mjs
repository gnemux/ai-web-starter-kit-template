import assert from "node:assert/strict";
import test from "node:test";
import { assertProductPageSource, assertProductRouteRelative } from "./product-route-boundary.mjs";

const thin = 'import { Screen } from "@/modules/product/screen";\nexport default function Page(){ return <Screen />; }\n';

test("thin product pages stay below the configured workspace", () => {
  assert.doesNotThrow(() => assertProductRouteRelative("workspace/page.tsx", "workspace"));
  assert.doesNotThrow(() => assertProductPageSource(thin, "workspace/page.tsx"));
  assert.throws(() => assertProductRouteRelative("account/page.tsx", "workspace"), /escapes/);
});

test("client, direct-provider, missing-module and thick product pages fail closed", () => {
  assert.throws(() => assertProductPageSource('"use client";\n' + thin, "workspace/client/page.tsx"), /server composition/);
  assert.throws(() => assertProductPageSource('import x from "@supabase/supabase-js";\n' + thin, "workspace/provider/page.tsx"), /provider/);
  assert.throws(() => assertProductPageSource("export default function Page(){ return null; }\n", "workspace/missing/page.tsx"), /product module/);
  assert.throws(() => assertProductPageSource(thin + "\n".repeat(40), "workspace/thick/page.tsx"), /too thick/);
});
