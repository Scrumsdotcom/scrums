# /company/schemas

Company-level domain entity schemas. Your customers, your products, your contracts, your invoices.

Framework-level primitive schemas live at [`/schemas`](../../schemas). Schemas in this directory are forkable per company.

Conventions:

- Every entity carries a permanent canonical ID with a prefix unique within the company
- External system IDs live under an `externalIds` array, never as primary keys
- Soft-delete is mandatory; hard-delete is forbidden
- `additionalProperties: false` everywhere
