import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function withLocalSupabase(contents, status) {
  if (!status?.API_URL || !status?.PUBLISHABLE_KEY) throw new Error("Local Supabase status is missing API_URL or PUBLISHABLE_KEY");
  return contents
    .replace(/^NEXT_PUBLIC_SUPABASE_URL=.*$/m, `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}`)
    .replace(/^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=.*$/m, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY}`);
}

function readLocalSupabaseStatus() {
  try {
    return JSON.parse(execFileSync("supabase", ["status", "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
  } catch {
    throw new Error("Local Supabase is not running. Start it before using --supabase-local.");
  }
}

export async function initializeEnvironment({ root = scriptRoot, localSupabase = false, status } = {}) {
  const source = path.join(root, ".env.example");
  const target = path.join(root, "apps/web/.env.local");
  let contents = await readFile(source, "utf8");
  if (localSupabase) contents = withLocalSupabase(contents, status ?? readLocalSupabaseStatus());
  await mkdir(path.dirname(target), { recursive: true });
  try {
    await writeFile(target, contents, { encoding: "utf8", flag: "wx", mode: 0o600 });
    return { created: true, target };
  } catch (error) {
    if (error?.code === "EEXIST") return { created: false, target };
    throw error;
  }
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const result = await initializeEnvironment({ localSupabase: process.argv.includes("--supabase-local") });
  console.log(result.created ? "Created apps/web/.env.local" : "Kept existing apps/web/.env.local; no values were overwritten");
}
