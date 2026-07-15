import { createHash } from "node:crypto";

export function ownerCacheTag(namespace: string, ownerId: string) {
  if (!/^[a-z][a-z0-9_-]{1,31}$/.test(namespace)) throw new Error("Invalid cache namespace");
  if (!ownerId || /[\u0000-\u001f\u007f/\\]/.test(ownerId)) throw new Error("Invalid cache owner");
  return `owner:${namespace}:${createHash("sha256").update(ownerId).digest("hex").slice(0, 24)}`;
}
