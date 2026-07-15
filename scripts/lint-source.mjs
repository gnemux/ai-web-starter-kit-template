import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set(["node_modules", ".next", ".turbo", ".vercel", "coverage", "dist"]);
async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(target));
    else if (/\.(?:ts|tsx|mjs)$/.test(entry.name)) files.push(target);
  }
  return files;
}
const failures = [];
for (const file of [...await filesUnder(path.join(root, "apps")), ...await filesUnder(path.join(root, "packages"))]) {
  const text = await readFile(file, "utf8");
  const relative = path.relative(root, file);
  if (/\t/.test(text)) failures.push(`${relative}: tab indentation`);
  if (/[ \t]+$/m.test(text)) failures.push(`${relative}: trailing whitespace`);
  if (/\bdebugger\b|@ts-ignore|eslint-disable/.test(text)) failures.push(`${relative}: disabled static safety`);
  if (/(?:\bas\s+any\b|:\s*any\b)/.test(text)) failures.push(`${relative}: explicit any`);
  if (/console\.(?:log|debug)\s*\(/.test(text)) failures.push(`${relative}: debug logging`);
}
if (failures.length > 0) throw new Error(`Source lint failed:\n${failures.join("\n")}`);
console.log("Source lint verified formatting, unsafe suppressions, explicit any and debug logging");
