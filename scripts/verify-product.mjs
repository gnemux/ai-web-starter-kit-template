#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { generatedProductModule, generatedSupabaseConfig, productState, validateProductConfig } from "./product-config.mjs";

const root = path.resolve(import.meta.dirname, "..");
const config = validateProductConfig(JSON.parse(await readFile(path.join(root, "product.config.json"), "utf8")));
const version = JSON.parse(await readFile(path.join(root, "template-version.json"), "utf8"));
const state = JSON.parse(await readFile(path.join(root, "product-state.json"), "utf8"));
assert.deepEqual(state, productState(config, version.candidateVersion, state.status));
assert.ok(["pristine", "derived"].includes(state.status));
assert.equal(await readFile(path.join(root, "apps/web/config/product.config.ts"), "utf8"), generatedProductModule(config, version.candidateVersion));
assert.equal(await readFile(path.join(root, "supabase/config.toml"), "utf8"), generatedSupabaseConfig(config));
console.log(`Product configuration verified: ${state.status} ${state.identity.id}`);
