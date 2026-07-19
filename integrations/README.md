# Integration boundaries

Every provider adapter is optional and safe-disabled or sandbox by default. Before enabling one, document its server/client boundary, environment variable names without values, payload minimization, timeout/retry/idempotency behavior, user-visible failure state, cost/privacy risk, test path and production approval gate.

Browser code may use only explicitly public keys. Service-role, webhook and provider secrets remain server-only. Provider dashboards are not schema or source-of-truth substitutes.

Auth providers follow the same boundary. Password recovery must keep the
scanner-safe email template and protected recovery route. Google OAuth is
optional and uses only the Supabase public browser configuration in the app;
Google client credentials remain in provider/Supabase controls. Apple stays
disabled until a product owner supplies the external account and completes its
own real-provider acceptance.
