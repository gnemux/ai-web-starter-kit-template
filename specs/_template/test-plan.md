# Test plan

## Unit and contract checks

## Access and security negatives

## Database reset and RLS/grant matrix

## Page states and responsive viewports

Run `pnpm exec playwright install chromium` once, then `pnpm test:browser`
against the disposable local Supabase project. The reusable smoke must cover
anonymous product return safety, local sign-up, product entry, same-URL locale
switching, shared Dialog/Toast behavior, profile save and refresh persistence
in both desktop and mobile projects.

## Provider disabled/sandbox paths

## Build, deployment and rollback checks

Create `apps/web/.env.local` through exactly one fresh-checkout path:
`pnpm env:init` for safe-disabled providers or, after `supabase start`,
`pnpm env:init -- --supabase-local` for Auth/profile acceptance. Confirm a
second invocation refuses to overwrite the file and that no service-role key
is present.

Record each result as pass, fail, blocked or not_run. Never replace an unrun gate with nearby evidence.
