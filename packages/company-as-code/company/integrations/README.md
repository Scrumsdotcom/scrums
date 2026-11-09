# /company/integrations

External system mappings. The framework names no vendor as canonical. Every integration here is a swappable plugin.

Each integration declares:

- canonical ID mapping (entity → external ID field)
- mutation direction (read-only, write-only, read-write, writeback-only)
- HITL surfaces (operations that require human confirmation)
- auth method and secret reference (never a literal secret)

Replacing a vendor changes a mapping. Domain logic does not move.

Validate against [`/schemas/integration.schema.json`](../../schemas/integration.schema.json).
