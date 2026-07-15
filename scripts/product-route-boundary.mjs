const productModuleImport = /from\s+["']@\/modules\/product(?:\/|["'])/;
const directRuntimeImport = /from\s+["'](?:@supabase\/|posthog-js|@\/modules\/platform\/supabase|@\/modules\/platform\/providers)/;

export function assertProductRouteRelative(relative, workspace) {
  if (relative.split("/")[0] !== workspace) throw new Error("Product route escapes the configured workspace root: " + relative);
}

export function assertProductPageSource(text, relative, maxLines = 40) {
  if (/^["']use client["'];/m.test(text)) throw new Error("Product page must remain a server composition layer: " + relative);
  if (!productModuleImport.test(text)) throw new Error("Product page must compose a public product module: " + relative);
  if (directRuntimeImport.test(text) || /SERVICE_ROLE|SECRET_KEY/.test(text)) throw new Error("Product page imports a direct provider/runtime boundary: " + relative);
  if (text.split("\n").length > maxLines) throw new Error("Product page is too thick; move behavior into modules/product: " + relative);
}
