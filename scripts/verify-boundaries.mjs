import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

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
  if (/from\s+["'](?:@\/|\.\.\/\.\.\/apps|next\/|@supabase\/|posthog-js)/.test(text)) fail(`Package imports an application/runtime SDK: ${path.relative(root, file)}`);
  if (/from\s+["']@xwlc\/(?:core|ui|platform|db)\//.test(text)) fail(`Package imports another package's internal path: ${path.relative(root, file)}`);
  if (file.includes("packages/core/") && /from\s+["']@xwlc\//.test(text)) fail(`Core package imports a higher package: ${path.relative(root, file)}`);
}
for (const file of await filesUnder(path.join(root, "apps/web/modules/platform"))) {
  if (!/\.(?:ts|tsx)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  if (/from\s+["'](?:@\/modules\/product(?:\/|["'])|(?:\.\.\/)+(?:product)(?:\/|["']))/.test(text)) fail(`Platform module imports product code: ${path.relative(root, file)}`);
  if (/SERVICE_ROLE|SECRET_KEY/.test(text)) fail(`Platform browser boundary contains privileged-key vocabulary: ${path.relative(root, file)}`);
}
for (const file of await filesUnder(path.join(root, "apps/web/modules/product"))) {
  if (!/\.(?:ts|tsx)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  if (/from\s+["']@xwlc\/(?:core|ui|platform|db)\//.test(text)) fail(`Product imports a package internal path: ${path.relative(root, file)}`);
}
for (const file of await filesUnder(path.join(root, "apps/web"))) {
  if (!/\.(?:ts|tsx)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  if (/^["']use client["'];/m.test(text) && /from\s+["'][^"']*(?:\/server|server-only)/.test(text)) fail(`Client module imports a server boundary: ${path.relative(root, file)}`);
}
const productRoute = await readFile(path.join(root, "apps/web/app/product/page.tsx"), "utf8");
if (!productRoute.includes('from "@/modules/product/product-workspace"') || !productRoute.includes("<ProductWorkspace")) fail("Product route must compose the product module");
if (productRoute.includes("<PageHeader") || productRoute.split("\n").length > 20) fail("Product route is no longer a thin Auth/routing composition layer");
const appTexts = await Promise.all((await filesUnder(path.join(root, "apps/web"))).filter((file) => /\.(?:ts|tsx)$/.test(file)).map((file) => readFile(file, "utf8")));
const allAppText = appTexts.join("\n");
for (const primitive of ["Button", "FormField", "Textarea", "Select", "Checkbox", "Card", "Tabs", "Dialog", "Popover", "Toast", "StatePanel"]) {
  if (!new RegExp(`\\b${primitive}\\b`).test(allAppText)) fail(`Shared UI primitive has no candidate consumer: ${primitive}`);
}
const ui = await readFile(path.join(root, "packages/ui/src/index.tsx"), "utf8");
const dialog = await readFile(path.join(root, "packages/ui/src/dialog.tsx"), "utf8");
const productWorkspace = await readFile(path.join(root, "apps/web/modules/product/product-workspace.tsx"), "utf8");
if (/function Tabs[\s\S]*?<a\b/.test(ui) || !productWorkspace.includes('import Link from "next/link"') || !productWorkspace.includes("<Tabs")) fail("Tabs must inject application routing instead of owning raw anchors");
if (!/function Button\(\{ type = "button"/.test(ui)) fail("Shared Button must default to non-submitting behavior");
for (const contract of ["useId", "showModal()", "onCancel", "onOpenChange(false)", "returnFocus.current?.focus()"] ) if (!dialog.includes(contract)) fail(`Accessible modal contract missing: ${contract}`);
for (const adapter of ["modules/platform/payment/sandbox.ts", "modules/platform/ai/mock.ts"]) if (!(await filesUnder(path.join(root, "apps/web"))).some((file) => file.endsWith(adapter))) fail(`Safe adapter missing: ${adapter}`);
const sharedText = (await Promise.all((await filesUnder(path.join(root, "packages"))).filter((file) => /\.(?:ts|tsx)$/.test(file)).map((file) => readFile(file, "utf8"))))
  .map((text) => text.replace(/from\s+["']@xwlc\/(?:core|ui|platform|db)["']/g, "from <public-package>"))
  .join("\n").toLowerCase();
for (const term of ["defaultbillingplans", "defaultbillingprices", "xwlc", "demo_" + "items", "cat" + "care"]) if (sharedText.includes(term)) fail(`Shared package contains fixed product vocabulary: ${term}`);

const relativeImportFixture = `import { thing } from "../product/private"`;
if (!/from\s+["'](?:@\/modules\/product(?:\/|["'])|(?:\.\.\/)+(?:product)(?:\/|["']))/.test(relativeImportFixture)) fail("Boundary fixture failed to detect relative platform-to-product import");
if (!/from\s+["']@xwlc\/(?:core|ui|platform|db)\//.test(`import x from "@xwlc/core/internal"`)) fail("Boundary fixture failed to detect package internals");
if (!/from\s+["']@xwlc\//.test(`import x from "@xwlc/platform"`)) fail("Boundary fixture failed to protect the Core dependency direction");
if (!/from\s+["'][^"']*(?:\/server|server-only)/.test(`import x from "../supabase/server"`)) fail("Boundary fixture failed to detect client-to-server import");
console.log("Package and application boundaries verified");
