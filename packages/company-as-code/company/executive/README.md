# /company/executive

Top of the cognition tree. The executive layer holds CEO-scope cognition and one node per canonical domain. Domain executives delegate down into `/company/domains/<domain>/<module>`.

| Subdir | Cognition |
|---|---|
| [`/ceo`](./ceo) | Company-wide strategic cognition. Roll-up of all domains. |
| [`/finance-ops`](./finance-ops) | Domain executive for finance-ops. |
| [`/product-operations`](./product-operations) | Domain executive for product-operations. |
| [`/sales-marketing`](./sales-marketing) | Domain executive for sales-marketing. |

Each executive module declares its own manifest, owned agents, and the interfaces it exposes to the rest of the organization (typically read-only roll-ups of domain state).
