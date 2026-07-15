# Acceptance

## User outcome

## Required evidence

- frozen install, lint, typecheck, unit/contract tests and production build;
- disposable local database reset and pgTAP result;
- desktop and mobile `pnpm test:browser` result;
- protected `tests/foundation` result plus any product-owned
  `tests/product` journeys;
- real local page review using only the generated candidate.

## Security and data checks

The app environment contains only public local Supabase values. No shared cloud
database, provider secret, production deployment or real customer record is
used by the candidate acceptance.

## Reviewer path

## Deferred and not-run gates

## Stop condition
