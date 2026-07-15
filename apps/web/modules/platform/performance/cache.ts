import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { ownerCacheTag } from "./cache-key";

export function cacheOwnerFact<T>(namespace: string, ownerId: string, loader: () => Promise<T>, ttlSeconds = 60) {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > 3600) throw new Error("Cache TTL must be between 1 and 3600 seconds");
  const tag = ownerCacheTag(namespace, ownerId);
  return unstable_cache(loader, [namespace, ownerId], { revalidate: ttlSeconds, tags: [tag] })();
}

export function invalidateOwnerFact(namespace: string, ownerId: string) {
  revalidateTag(ownerCacheTag(namespace, ownerId));
}
