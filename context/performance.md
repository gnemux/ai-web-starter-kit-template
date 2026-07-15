# Performance foundation

Use React request memoization for repeated Auth/current-account reads in one render. Do not use process-local Maps for user or product facts. Cache cross-request Billing or capability reads only with exact owner-scoped tags, bounded TTLs, and exact invalidation after trusted writes.

Fetch independent facts in parallel and provide bulk service methods when a list would otherwise cause N+1 calls. After a mutation, revalidate the smallest affected route/tag; do not use a browser-wide hard reload as the default refresh mechanism.

Do not hard-code a region from the research environment. Choose deployment and database region together after the product market and data residency needs are known, then measure before adding more caching.
