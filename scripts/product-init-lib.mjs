import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { configHash, generatedProductModule, generatedSupabaseConfig, productState, productWorkspaceSegment, validateProductConfig } from "./product-config.mjs";

export async function initializeProduct({ root, input, force = false, failAfterRename = -1 }) {
  const absoluteInput = path.resolve(input);
  if (absoluteInput === root || absoluteInput.startsWith(`${root}${path.sep}node_modules${path.sep}`)) throw new Error("Product config path is unsafe");
  const config = validateProductConfig(JSON.parse(await readFile(absoluteInput, "utf8")));
  const version = JSON.parse(await readFile(path.join(root, "template-version.json"), "utf8"));
  const currentState = JSON.parse(await readFile(path.join(root, "product-state.json"), "utf8"));
  const currentConfig = validateProductConfig(JSON.parse(await readFile(path.join(root, "product.config.json"), "utf8")));
  const nextHash = configHash(config);
  if (currentState.status === "derived" && nextHash !== currentState.configHash && !force) throw new Error("Product is already derived; pass --force to replace its identity intentionally");
  const outputs = new Map([
    [path.join(root, "product.config.json"), `${JSON.stringify(config, null, 2)}\n`],
    [path.join(root, "apps/web/config/product.config.ts"), generatedProductModule(config, version.candidateVersion)],
    [path.join(root, "supabase/config.toml"), generatedSupabaseConfig(config)],
    [path.join(root, "product-state.json"), `${JSON.stringify(productState(config, version.candidateVersion, "derived"), null, 2)}\n`],
  ]);
  const originals = new Map(await Promise.all([...outputs.keys()].map(async (file) => [file, await readFile(file)])));
  const staged = new Map([...outputs.keys()].map((file, index) => [file, `${file}.product-init-${process.pid}-${index}`]));
  const routeRoot = path.join(root, "apps/web/app/(product)");
  const currentRoute = path.join(routeRoot, productWorkspaceSegment(currentConfig.paths.product));
  const nextRoute = path.join(routeRoot, productWorkspaceSegment(config.paths.product));
  const routeChanges = currentRoute !== nextRoute;
  if (routeChanges) {
    await stat(currentRoute);
    try { await stat(nextRoute); throw new Error(`Product route already exists: ${config.paths.product}`); }
    catch (error) { if (error?.code !== "ENOENT") throw error; }
  }
  let routeMoved = false;
  try {
    for (const [file, value] of outputs) await writeFile(staged.get(file), value, { flag: "wx" });
    if (routeChanges) {
      await mkdir(routeRoot, { recursive: true });
      await rename(currentRoute, nextRoute);
      routeMoved = true;
    }
    let renamed = 0;
    for (const file of outputs.keys()) {
      await rename(staged.get(file), file);
      renamed += 1;
      if (renamed === failAfterRename) throw new Error("Injected product initialization failure");
    }
  } catch (error) {
    await Promise.all([...originals].map(([file, value]) => writeFile(file, value)));
    await Promise.all([...staged.values()].map((file) => rm(file, { force: true })));
    if (routeMoved) await rename(nextRoute, currentRoute);
    throw error;
  }
  return { config, candidateVersion: version.candidateVersion, route: config.paths.product };
}
