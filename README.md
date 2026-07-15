# Clean product candidate

This repository is a generated, single-product starting point. It contains one deployable web app, local workspace snapshots of four neutral foundation packages, and one independent database baseline. It contains no research-product runtime or migration history.

## Start locally

1. Use Node 22 and pnpm 9.15.0.
2. Run `pnpm install --frozen-lockfile`.
3. Choose one environment path on a fresh checkout. For provider-safe disabled pages, run `pnpm env:init`. For real local Auth/profile acceptance, run `supabase start` and then `pnpm env:init -- --supabase-local`. Both commands create the ignored `apps/web/.env.local`; neither overwrites an existing file. Do not copy the example to the repository root because Next runs from `apps/web`.
4. Run `supabase db reset`, `pnpm test:database`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
5. Run `pnpm --filter @xwlc/web dev` and review `/`, `/login`, `/account`, `/account/billing`, `/account/usage`, and the configured `paths.product`.
6. For the reusable production-mode browser regression, install its pinned Chromium once with `pnpm exec playwright install chromium`, keep local Supabase running, and run `pnpm test:browser`. The protected foundation suite always runs; product tests under `tests/product` are optional until a real product journey exists.

## Customize safely

Keep one untouched generated copy as the candidate evidence. In the new product repository, edit `product.config.json`, then run `pnpm product:init`. To import a separate config, run `pnpm product:init -- --config /path/product.json`; replacing an already-derived identity requires `--force`. Initialization atomically updates the four generated config/state files and, when `paths.product` changes, moves the complete editable product route subtree to that safe workspace root. It refuses reserved paths and existing destinations. Run `pnpm product:verify` and `pnpm template:verify` afterwards.

Product-specific code belongs in `apps/web/modules/product`; its thin pages belong below `apps/web/app/(product)/<workspace-root>`; product assets, specs, tests and migrations stay in their declared editable roots. Platform application adapters and routes belong in protected `apps/web/modules/platform` and `apps/web/app` surfaces; provider-free contracts belong in `packages/*`. A real product receives its own repository, deployment, environment, and migration history.

Provider modes are safe-disabled or sandbox by default. Do not claim live Analytics, Payment, AI, email, storage, or production database readiness until the selected product performs its own gated verification.
