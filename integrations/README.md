# Integration boundaries

Every provider adapter is optional and safe-disabled or sandbox by default. Before enabling one, document its server/client boundary, environment variable names without values, payload minimization, timeout/retry/idempotency behavior, user-visible failure state, cost/privacy risk, test path and production approval gate.

Browser code may use only explicitly public keys. Service-role, webhook and provider secrets remain server-only. Provider dashboards are not schema or source-of-truth substitutes.
