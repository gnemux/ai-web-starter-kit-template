# Engineering specification

## Ownership and boundaries

State which files are product-owned, platform-app adapters, shared packages and provider integrations. A platform module must not import product code.

## Data and security

Define tables, ownership, RLS/grants, service-only writes, idempotency and secret boundaries. Use a repository migration and disposable verification.

## Mutable entity and immutable history checklist

Before adding delete behavior, answer:

- Is the record a mutable entity, or an immutable fact such as a published, executed, billed or audited result?
- Should removal hide it only from active lists through archive/tombstone state?
- Must historical facts preserve a snapshot or render a stable `(deleted)` marker?
- Can concurrent publish/execute/delete operations race, and what transaction or constraint prevents inconsistency?
- Is physical purge forbidden until retention, legal and reference checks pass?
- Is this still product-local, or does a second real product require the same provider-free lifecycle state machine?

Do not extract a generic lifecycle implementation from one product. Record the contract and extract only when a second consumer proves the same semantics.

## Performance

Describe request memoization, bulk access, bounded owner cache keys, exact invalidation and targeted refresh. Do not add broad process caches or a fixed region without evidence.

## Failure and rollback

## Verification evidence
