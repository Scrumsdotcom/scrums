# Skill: add-integration

> Wire a new external system into the coordination layer through canonical IDs — no vendor names in domain logic, HITL surfaces declared explicitly.

**Autonomy:** `human-gated`

**Triggers**
- A new SaaS vendor / cloud service / external API is being adopted.
- An existing integration is being replaced (the new one needs to land before the old one is retired).
- A new canonical entity needs to map to multiple external systems' IDs.

**Inputs**
- `integrationName` (`kebab-case`): Local canonical name for the integration. Vendor-neutral.
- `category` (`enum`): One of crm | workflow-engine | database | project-management | cloud | orchestration | ai-provider | communication | observability | billing | identity | storage | search | analytics | other.
- `ownerModule` (`module-path`): The module accountable for this integration.

**Outputs**
- `integrationPath` (`file-path`): Path to the validated integration manifest.

**Tools**
- `cli-generate`
- `cli-validate`
- `secret-manager`
- `shell`

**Related skills**
- `add-module`
- `sync-verification`

---

# Add an integration

Use this skill to wire a new external system into the coordination layer.
The framework names no vendor as canonical — every integration is pluggable,
every external ID lives under `externalIds`, every irreversible operation is
HITL by default.

## When to use

- You are adopting a new external system (CRM, billing, comms, IdP, etc.).
- You are replacing an existing integration with a different vendor.
- You are adding a second external system that maps to the same canonical entity.

## Inputs

- `integrationName` — kebab-case, vendor-neutral. The CRM is `customer-crm`,
  not the vendor's name.
- `category` — pulls from the schema's enum.
- `ownerModule` — the module accountable for this integration's health.

## Steps

1. **Copy the integration manifest pattern** from the worked example:
   ```bash
   cp company/integrations/example-crm.yaml company/integrations/<integrationName>.yaml
   ```

2. **Fill in the integration manifest.**
   - `name` — kebab-case local name; do not encode the vendor here
   - `system` — vendor identifier (optional, treated as a label)
   - `category` — schema enum value
   - `status` — `planned` initially, then `configured`, then `active`
   - `ownerModule` — accountable module
   - `mutationDirection` — `read-only` (preferred), `write-only`, `writeback-only`,
     or `read-write` (only with a documented conflict-resolution protocol)
   - `canonicalIdMapping` — for every canonical entity this integration touches,
     declare which `externalIdField` carries the mapping
   - `auth` — `kind` (api-key / oauth / service-account / mtls / webhook-signature)
     and `secretRef` (a pointer into your secret manager, **never** a literal
     secret)
   - `hitlRequiredFor` — operations that must go through human approval
     (writes to billing, communications, contracts, destructive deletes)
   - `rateLimits` — known limits, even if approximate

3. **Reference the integration from the owning module's manifest** if any agent
   or workflow consumes it. The `consumes:` block names the interface, not the
   integration directly.

4. **Add canonical seeds.** If this integration is the source of records for a
   new canonical entity (organization, person, customer), create at least one
   seed under `company/integrations/seeds/` with both the permanent
   `canonicalId` and the corresponding `externalIds[]` entry.

5. **Validate.**
   ```bash
   cd cli && npm run validate
   ```

6. **Regenerate.**
   ```bash
   npm run generate
   ```

7. **Drift gate.**
   ```bash
   npm run generate:check
   ```

8. **Before first live use, invoke `sync-verification`** — every operation
   listed under `hitlRequiredFor` must go through the 5-step protocol on its
   first invocation against this integration.

## Definition of done

- [ ] `company/integrations/<integrationName>.yaml` exists and validates
- [ ] `canonicalIdMapping` declares every entity this integration touches
- [ ] `mutationDirection` is the most restrictive valid choice
- [ ] `auth.secretRef` is a pointer; no literal secret in the YAML
- [ ] `hitlRequiredFor` is populated for every irreversible operation
- [ ] `npm run validate` is green
- [ ] `npm run generate:check` is green
- [ ] A seed record exists if this integration introduces a new canonical entity
- [ ] `sync-verification` is queued before any write operation runs against this
      integration

## Failure handling

- **You are tempted to put the vendor name in business logic** — stop. The
  integration's `name` is the contract; the `system` field is a label.
- **You want `mutationDirection: read-write` without a documented protocol** —
  split fields between the two systems instead. One owns the canonical value,
  the other owns a derived view. Round-trip syncs are defects.
- **A secret needs to live in the manifest** — it doesn't. Put the secret in
  the secret manager, put the pointer in `secretRef`.
- **An external ID changed during a rotation** — update the canonical entity's
  `externalIds[].rotatedAt`; the canonical ID stays the same.

## Related

- Skill: `sync-verification` — mandatory before first live write through this
  integration.
- Standard: `/docs/standards/security.md` — secrets and dependency review.
- Spec section: "Canonical IDs + Evolving System Mappings" — the principle this
  skill operationalizes.
