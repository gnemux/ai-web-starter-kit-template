# Engineering rules

- Specifications precede implementation and verification.
- Use a clean task branch based on current `main`; protect unrelated work.
- Keep one write-capable agent per core module.
- Product-local work uses the smallest complete change; shared foundation work uses the smallest durable boundary a second product can consume without product DTOs, copy or provider code.
- Never commit secrets, customer data, raw private tokens or provider payloads.
- Database changes require repository migrations and RLS/grant review.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before publication.
- Commit, push, PR, merge, deployment, production database and live provider actions follow the formal orchestration gates.
