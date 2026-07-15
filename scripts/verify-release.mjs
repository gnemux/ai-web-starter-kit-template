import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const packageFiles = ["package.json", ...(await readdir(path.join(root, "apps"))).map((name) => `apps/${name}/package.json`), ...(await readdir(path.join(root, "packages"))).map((name) => `packages/${name}/package.json`)];
const directExternal = new Map();
const workspaceVersions = new Map();
for (const file of packageFiles) {
  const manifest = JSON.parse(await readFile(path.join(root, file), "utf8"));
  workspaceVersions.set(manifest.name, manifest.version);
  for (const group of ["dependencies", "devDependencies", "peerDependencies"]) {
    for (const [name, version] of Object.entries(manifest[group] ?? {})) {
      if (!String(version).startsWith("workspace:") && !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(String(version))) throw new Error(`${file} has non-exact dependency ${name}@${version}`);
      if (!String(version).startsWith("workspace:")) directExternal.set(name, String(version));
    }
  }
}
const templateManifest = JSON.parse(await readFile(path.join(root, "template-manifest.json"), "utf8"));
for (const snapshot of templateManifest.packageSnapshots) {
  if (workspaceVersions.get(snapshot.name) !== snapshot.candidateVersion) throw new Error(`Package snapshot version mismatch: ${snapshot.name}`);
  if (snapshot.decision === "transform" && snapshot.sourceVersion === snapshot.candidateVersion) throw new Error(`Transformed public package must advance its snapshot version: ${snapshot.name}`);
}
const notices = await readFile(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8");
for (const [name, version] of directExternal) if (!notices.includes(`| ${name} | ${version} |`)) throw new Error(`Third-party notice missing for ${name}@${version}`);
const workflow = await readFile(path.join(root, ".github/workflows/ci.yml"), "utf8");
for (const use of workflow.matchAll(/uses:\s*([^\s]+)/g)) if (!/@[0-9a-f]{40}$/.test(use[1])) throw new Error(`Workflow action is not SHA pinned: ${use[1]}`);
const buildGate = workflow.indexOf("run: pnpm lint && pnpm typecheck && pnpm test && pnpm build");
const integrityGate = workflow.indexOf("- name: Verify candidate integrity\n        run: pnpm template:verify");
if (buildGate < 0 || integrityGate < buildGate) throw new Error("CI must verify candidate integrity after the build");
const vercelFiles = [path.join(root, "apps/web/vercel.json")];
if (vercelFiles.length !== 1) throw new Error("Exactly one Vercel config is required");
const vercel = JSON.parse(await readFile(vercelFiles[0], "utf8"));
if (vercel.framework !== "nextjs" || vercel.installCommand !== "cd ../.. && pnpm install --frozen-lockfile" || vercel.buildCommand !== "cd ../.. && pnpm turbo run build --filter=@xwlc/web" || vercel.outputDirectory !== ".next" || vercel.git?.deploymentEnabled?.main !== true || vercel.git?.deploymentEnabled?.["**"] !== false) throw new Error("Vercel build contract mismatch");
if ("regions" in vercel) throw new Error("Research-region assumptions are forbidden");
const turbo = JSON.parse(await readFile(path.join(root, "turbo.json"), "utf8"));
if (!turbo.tasks?.build?.outputs?.includes("!.next/cache/**")) throw new Error("Turbo must exclude the non-portable Next cache");
const accountReader = await readFile(path.join(root, "apps/web/modules/platform/auth/current-account.ts"), "utf8");
const accountWriter = await readFile(path.join(root, "apps/web/modules/platform/auth/actions.ts"), "utf8");
if (!accountReader.includes('cacheOwnerFact("account_profile", data.user.id')) throw new Error("Owner-scoped account cache has no real read consumer");
if (!accountWriter.includes('invalidateOwnerFact("account_profile", data.user.id)') || !accountWriter.includes("revalidatePath(productConfig.paths.account)")) throw new Error("Account writes must precisely invalidate the owner fact and account path");
const rootPackage = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
if (!rootPackage.scripts?.lint?.includes("scripts/lint-source.mjs")) throw new Error("Lint must include an independent source-quality gate, not only typecheck");
console.log("Release and supply-chain boundaries verified");
