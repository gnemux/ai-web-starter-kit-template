#!/usr/bin/env node
import path from "node:path";
import { initializeProduct } from "./product-init-lib.mjs";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const valueFor = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const input = valueFor("--config") ?? path.join(root, "product.config.json");
const result = await initializeProduct({ root, input, force: args.includes("--force") });
console.log(`Initialized ${result.config.identity.name} (${result.config.identity.id}) from template ${result.candidateVersion}`);
