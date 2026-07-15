import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { productWorkspaceSegment, validateProductConfig } from "./product-config.mjs";
import { assertProductPageSource, assertProductRouteRelative } from "./product-route-boundary.mjs";

const root = path.resolve(import.meta.dirname, "..");
async function filesUnder(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(absolute));
    else result.push(absolute);
  }
  return result;
}
function fail(message) { throw new Error(message); }

for (const file of await filesUnder(path.join(root, "packages"))) {
  if (!/\.(?:ts|tsx|mjs)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  if (/from\s+["'](?:@\/|\.\.\/\.\.\/apps|next\/|@supabase\/|posthog-js)/.test(text)) fail("Package imports an application/runtime SDK: " + path.relative(root, file));
  if (/from\s+["']@xwlc\/(?:core|ui|platform|db)\//.test(text)) fail("Package imports another package's internal path: " + path.relative(root, file));
  if (file.includes("packages/core/") && /from\s+["']@xwlc\//.test(text)) fail("Core package imports a higher package: " + path.relative(root, file));
}
for (const file of await filesUnder(path.join(root, "apps/web/modules/platform"))) {
  if (!/\.(?:ts|tsx)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  if (/from\s+["'](?:@\/modules\/product(?:\/|["'])|(?:\.\.\/)+(?:product)(?:\/|["']))/.test(text)) fail("Platform module imports product code: " + path.relative(root, file));
  if (/SERVICE_ROLE|SECRET_KEY/.test(text)) fail("Platform browser boundary contains privileged-key vocabulary: " + path.relative(root, file));
}
for (const file of await filesUnder(path.join(root, "apps/web/modules/product"))) {
  if (!/\.(?:ts|tsx)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  if (/from\s+["']@xwlc\/(?:core|ui|platform|db)\//.test(text)) fail("Product imports a package internal path: " + path.relative(root, file));
}
for (const file of await filesUnder(path.join(root, "apps/web"))) {
  if (!/\.(?:ts|tsx)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  if (/^["']use client["'];/m.test(text) && /from\s+["'][^"']*(?:\/server|server-only)/.test(text)) fail("Client module imports a server boundary: " + path.relative(root, file));
}

const config = validateProductConfig(JSON.parse(await readFile(path.join(root, "product.config.json"), "utf8")));
const workspace = productWorkspaceSegment(config.paths.product);
const productRouteRoot = path.join(root, "apps/web/app/(product)");
const productPages = (await filesUnder(productRouteRoot)).filter((file) => file.endsWith(path.sep + "page.tsx"));
const requiredEntry = path.join(productRouteRoot, workspace, "page.tsx");
if (!productPages.includes(requiredEntry)) fail("Configured product route is missing: " + config.paths.product);
for (const file of productPages) {
  const relative = path.relative(productRouteRoot, file).split(path.sep).join("/");
  assertProductRouteRelative(relative, workspace);
  const text = await readFile(file, "utf8");
  assertProductPageSource(text, relative);
}

const protectedConsumers = new Map([
  ["apps/web/app/login/page.tsx", ["NavTabs", "FormField", "Input", "Notice"]],
  ["apps/web/app/account/page.tsx", ["Card", "PageHeader", "StatePanel"]],
  ["apps/web/app/account/profile-form.tsx", ["Toast"]],
  ["apps/web/app/account/account-sign-out.tsx", ["Dialog"]],
  ["apps/web/app/not-found.tsx", ["StatePanel"]],
]);
for (const [file, contracts] of protectedConsumers) {
  const text = await readFile(path.join(root, file), "utf8");
  for (const contract of contracts) if (!new RegExp("\\b" + contract + "\\b").test(text)) fail("Protected foundation consumer missing shared UI " + contract + ": " + file);
}

const ui = await readFile(path.join(root, "packages/ui/src/index.tsx"), "utf8");
const icons = await readFile(path.join(root, "packages/ui/src/icons.tsx"), "utf8");
const dialog = await readFile(path.join(root, "packages/ui/src/dialog.tsx"), "utf8");
if (/export const Tabs\b|function Popover\b/.test(ui) || !/function NavTabs\b/.test(ui) || !/function Disclosure\b/.test(ui)) fail("Shared UI component names must match navigation and disclosure semantics");
if (!/function Button\(\{ type = "button"/.test(ui)) fail("Shared Button must default to non-submitting behavior");
for (const contract of ["useId", "showModal()", "onCancel", "onOpenChange(false)", "returnFocus.current?.focus()", "CloseIcon"]) if (!dialog.includes(contract)) fail("Accessible modal contract missing: " + contract);
for (const icon of ["CloseIcon", "ChevronDownIcon", "CheckIcon", "InfoIcon", "WarningIcon"]) if (!icons.includes("function " + icon)) fail("Neutral UI icon missing: " + icon);
for (const adapter of ["modules/platform/payment/sandbox.ts", "modules/platform/ai/mock.ts"]) if (!(await filesUnder(path.join(root, "apps/web"))).some((file) => file.endsWith(adapter))) fail("Safe adapter missing: " + adapter);

const playwright = await readFile(path.join(root, "playwright.config.ts"), "utf8");
const packageManifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
if (!playwright.includes('testDir: "./tests"') || !playwright.includes("next start")) fail("Browser regression must own both suites and run against a production server");
if (!packageManifest.scripts["test:browser:foundation"] || !packageManifest.scripts["test:browser:product"]?.includes("pass-with-no-tests")) fail("Foundation and optional product browser suites must have separate scripts");
await readFile(path.join(root, "tests/foundation/template-smoke.spec.ts"));

const sharedText = (await Promise.all((await filesUnder(path.join(root, "packages"))).filter((file) => /\.(?:ts|tsx)$/.test(file)).map((file) => readFile(file, "utf8"))))
  .map((text) => text.replace(/from\s+["']@xwlc\/(?:core|ui|platform|db)["']/g, "from <public-package>"))
  .join("\n").toLowerCase();
for (const term of ["defaultbillingplans", "defaultbillingprices", "xwlc", "demo_" + "items", "cat" + "care"]) if (sharedText.includes(term)) fail("Shared package contains fixed product vocabulary: " + term);

const relativeImportFixture = 'import { thing } from "../product/private"';
if (!/from\s+["'](?:@\/modules\/product(?:\/|["'])|(?:\.\.\/)+(?:product)(?:\/|["']))/.test(relativeImportFixture)) fail("Boundary fixture failed to detect relative platform-to-product import");
if (!/from\s+["']@xwlc\/(?:core|ui|platform|db)\//.test('import x from "@xwlc/core/internal"')) fail("Boundary fixture failed to detect package internals");
if (!/from\s+["']@xwlc\//.test('import x from "@xwlc/platform"')) fail("Boundary fixture failed to protect the Core dependency direction");
if (!/from\s+["'][^"']*(?:\/server|server-only)/.test('import x from "../supabase/server"')) fail("Boundary fixture failed to detect client-to-server import");
console.log("Package, platform and configurable product-route boundaries verified (workspace=" + config.paths.product + ", pages=" + productPages.length + ")");
