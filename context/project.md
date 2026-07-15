# Project context

This repository contains one product. Its generated identity is the current source of truth. The foundation provides neutral Auth, account, Billing/Credit/Usage, Payment, AI, Analytics, UI, database and delivery boundaries; it does not define the product workflow.

Keep product domain logic in `apps/web/modules/product`, thin product pages below
`apps/web/app/(product)/<workspace-root>`, application/provider adapters in
`apps/web/modules/platform`, and provider-free shared contracts in
`packages/*`. Platform routes and `tests/foundation` are protected;
`tests/product` belongs to this product. Promote a capability into the
foundation only after its product-independent contract is proven and a second
real consumer would otherwise copy it.
