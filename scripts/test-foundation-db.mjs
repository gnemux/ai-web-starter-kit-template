#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const config = await readFile(path.join(root, "supabase/config.toml"), "utf8");
const projectId = config.match(/^project_id\s*=\s*"([A-Za-z0-9_-]+)"/m)?.[1];
if (!projectId) throw new Error("Supabase project_id is missing or unsafe");

const sql = await readFile(path.join(root, "supabase/tests/foundation_test.sql"), "utf8");
const expected = Number(sql.match(/select\s+plan\((\d+)\)/i)?.[1]);
if (!Number.isSafeInteger(expected) || expected < 1) throw new Error("Foundation pgTAP plan is missing or invalid");

const result = spawnSync("docker", [
  "exec", "-i", `supabase_db_${projectId}`,
  "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-A", "-t"
], { cwd: root, encoding: "utf8", input: sql, maxBuffer: 8 * 1024 * 1024 });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`Foundation pgTAP execution failed:\n${result.stderr.trim() || result.stdout.trim()}`);

const lines = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const plans = lines.filter((line) => /^1\.\.\d+$/.test(line));
const passed = lines.filter((line) => /^ok\s+\d+\s+-\s+/.test(line));
const failed = lines.filter((line) => /^not ok\s+\d+\s+-\s+/.test(line));
if (plans.length !== 1 || plans[0] !== `1..${expected}` || passed.length !== expected || failed.length > 0) {
  throw new Error(`Foundation pgTAP did not fully pass (plan=${plans.join(",") || "missing"}, passed=${passed.length}, failed=${failed.length}, expected=${expected})`);
}
console.log(`Foundation pgTAP verified ${passed.length}/${expected} assertions in disposable local Supabase`);
