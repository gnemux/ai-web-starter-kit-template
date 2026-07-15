import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { generatedProductModule, generatedSupabaseConfig, productState } from "./product-config.mjs";

const root = path.resolve(import.meta.dirname, "..");
const ignored = new Set([".git", "node_modules", ".next", ".turbo", ".vercel", ".temp", ".branches", "coverage", "dist", "test-results", "playwright-report"]);
const pristineNextEnv = "/// <reference types=\"next\" />\n/// <reference types=\"next/image-types/global\" />\n";
const generatedNextEnv = `${pristineNextEnv}/// <reference path=\"./.next/types/routes.d.ts\" />\n\n// NOTE: This file should not be edited\n// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.\n`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const joinedSignatures = (groups) => groups.map((parts) => parts.join(""));
const productSignatures = joinedSignatures([
  ["cat", "care"], ["reference-", "product"], ["demo_", "items"], ["demo-", "items"], ["cat-", "photos"],
]);
const environmentSignatures = joinedSignatures([
  ["ngli", "lxhkuqzswbwitbdu"],
  ["ai-web-starter-kit-web", ".vercel.app"],
  ["posthog.com/project/", "476", "986"],
]);
const absolutePathSignatures = joinedSignatures([
  ["/", "Users", "/"], ["/private/", "tmp", "/"], [":\\", "Users", "\\"],
]);
const secretPattern = new RegExp(`(?:${["sk", "live"].join("_")}_|gh[opsu]_[A-Za-z0-9]{20,}|${["sb", "secret"].join("_")}_[A-Za-z0-9_-]{20,})`);

async function listFiles(relative = "") {
  const files = [];
  for (const entry of (await readdir(path.join(root, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (ignored.has(entry.name) || entry.name.endsWith(".tsbuildinfo")) continue;
    const next = path.posix.join(relative, entry.name);
    if (entry.isFile() && /(?:^|\/)\.env(?:\..+)?$/.test(next) && !next.endsWith(".env.example")) continue;
    if ((await lstat(path.join(root, next))).isSymbolicLink()) throw new Error(`Symlink is forbidden: ${next}`);
    if (entry.isDirectory()) files.push(...await listFiles(next));
    else files.push(next);
  }
  return files;
}

async function hashFiles(files, normalizeNextEnv = false, overrides = new Map()) {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    let bytes = overrides.has(file) ? Buffer.from(overrides.get(file)) : await readFile(path.join(root, file));
    if (normalizeNextEnv && file === "apps/web/next-env.d.ts") {
      const value = bytes.toString("utf8");
      if (value !== pristineNextEnv && value !== generatedNextEnv) throw new Error("next-env.d.ts has an unapproved mutation");
      bytes = Buffer.from(pristineNextEnv);
    }
    hash.update(file).update("\0").update(bytes).update("\0");
  }
  return hash.digest("hex");
}

const version = JSON.parse(await readFile(path.join(root, "template-version.json"), "utf8"));
const manifest = JSON.parse(await readFile(path.join(root, "template-manifest.json"), "utf8"));
const product = JSON.parse(await readFile(path.join(root, "template-product.json"), "utf8"));
const currentState = JSON.parse(await readFile(path.join(root, "product-state.json"), "utf8"));
const files = await listFiles();
const expected = manifest.artifacts.map((entry) => entry.target).sort();
const isEditable = (file) => manifest.productConfigAllowedChanges.includes(file)
  || (!manifest.productExtensions.protectedFiles.includes(file) && manifest.productExtensions.editableRoots.some((root) => file.startsWith(root)));
const required = manifest.artifacts.filter((entry) => !entry.productEditable).map((entry) => entry.target);
const missing = required.filter((file) => !files.includes(file));
const unknown = files.filter((file) => !expected.includes(file) && !isEditable(file));
if (missing.length || unknown.length) throw new Error(`Candidate layer mismatch. Missing protected files: ${missing.join(", ") || "none"}; undeclared files outside product roots: ${unknown.join(", ") || "none"}`);
for (const file of manifest.productExtensions.protectedFiles) if (!files.includes(file) || !expected.includes(file)) throw new Error(`Protected product-root file missing: ${file}`);

if (sha256(JSON.stringify(manifest)) !== version.hashes.manifest) throw new Error("Manifest hash mismatch");
if (sha256(JSON.stringify(product)) !== version.hashes.config) throw new Error("Product config hash mismatch");
if (sha256(await readFile(path.join(root, "pnpm-lock.yaml"))) !== version.hashes.candidateLock) throw new Error("Lockfile hash mismatch");
if (sha256(await readFile(path.join(root, "THIRD_PARTY_NOTICES.md"))) !== version.notices.hash) throw new Error("Notices hash mismatch");
const expectedAllowedChanges = ["apps/web/config/product.config.ts", "product.config.json", "product-state.json", "supabase/config.toml"].sort();
if (JSON.stringify([...manifest.productConfigAllowedChanges].sort()) !== JSON.stringify(expectedAllowedChanges)) throw new Error("Product initialization allowlist is broader than the reviewed four-file boundary");
if (!["pristine", "derived"].includes(currentState.status)) throw new Error("Unknown product derivation state");
const normalizedProductOverrides = currentState.status === "derived" ? new Map([
  ["apps/web/config/product.config.ts", generatedProductModule(product, version.candidateVersion)],
  ["product.config.json", `${JSON.stringify(product, null, 2)}\n`],
  ["product-state.json", `${JSON.stringify(productState(product, version.candidateVersion), null, 2)}\n`],
  ["supabase/config.toml", generatedSupabaseConfig(product)],
]) : new Map();
const protectedFiles = files.filter((file) => file !== "template-version.json" && !isEditable(file));
if (await hashFiles(protectedFiles, true, normalizedProductOverrides) !== version.hashes.protectedContent) throw new Error("Protected candidate foundation hash mismatch");

for (const file of files) {
  if (/(?:^|\/)\.env(?:\..+)?$/.test(file) && !file.endsWith(".env.example")) throw new Error(`Private environment file: ${file}`);
  if (productSignatures.some((value) => file.toLowerCase().includes(value))) throw new Error(`Product path pollution: ${file}`);
  const bytes = await readFile(path.join(root, file));
  let text;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { throw new Error(`Unclassified binary: ${file}`); }
  if (absolutePathSignatures.some((value) => text.includes(value))) throw new Error(`Absolute source path: ${file}`);
  if (secretPattern.test(text)) throw new Error(`Secret-shaped value: ${file}`);
  if (/\bGNE-\d+\b|\bPR\s*#\d+\b/i.test(text) || environmentSignatures.some((value) => text.toLowerCase().includes(value))) throw new Error(`Execution-history identifier: ${file}`);
  if (!(currentState.status === "derived" && manifest.productConfigAllowedChanges.includes(file)) && productSignatures.some((value) => text.toLowerCase().includes(value))) throw new Error(`Product content pollution: ${file}`);
}

console.log(`Candidate three-layer integrity verified (${currentState.status}; protected=${protectedFiles.length}; product=${files.filter(isEditable).length}): ${version.candidateVersion} from ${version.source.commit}`);
