# Project context

This repository contains one product. Its generated identity is the current source of truth. The foundation provides neutral Auth, account, Billing/Credit/Usage, Payment, AI, Analytics, UI, database and delivery boundaries; it does not define the product workflow.

Keep product domain logic in `apps/web/modules/product`, application/provider adapters in `apps/web/modules/platform`, and provider-free shared contracts in `packages/*`. Promote a capability into the foundation only after its product-independent contract is proven and a second real consumer would otherwise copy it.
