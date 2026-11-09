// Generated from /schemas/state-snapshot.schema.json, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** An immutable, versioned checkpoint of the company's canonical coordination state, canonical entity IDs and their evolving external system mappings. Snapshots make rollback to a known-good state a first-class runtime operation. The append-only audit log and typed-event ledger are never rewound; a rollback rolls history forward by emitting a coordination.state_rolled_back event. */
export interface StateSnapshot {
  apiVersion: "company-as-code/v1alpha1";
  kind: "StateSnapshot";
  /** Snapshot ID, e.g. 'snap-01jh...'. */
  id: string;
  /** Optional human label, e.g. 'pre-billing-migration'. */
  label?: string;
  createdAt: string;
  /** sha256 of the canonical-JSON snapshot content. Equal hashes captured identical state. */
  contentHash: string;
  entityCount: number;
  mappingCount: number;
  /** Every canonical entity at snapshot time. */
  entities: Array<{
    /** Permanent internal ID. Never changes for the lifetime of the entity. */
    canonicalId: string;
    /** Canonical entity type, e.g. 'customer', 'task'. */
    kind: string;
    /** L1 universal lifecycle bucket on the canonical state ladder. */
    l1Bucket: string;
    createdAt: string;
    /** Set when soft-deleted. Records are never hard-deleted. */
    tombstonedAt?: string;
    tombstoneReason?: string;
    /** Canonical ID this entity was merged into. Merges are reversible pointers. */
    mergedInto?: string;
  }>;
  /** Every external-system mapping at snapshot time. */
  mappings: Array<{
    /** The canonical entity this mapping points at. */
    canonicalId: string;
    /** Canonical name of the external system, e.g. 'crm'. */
    system: string;
    /** The ID that external system assigned to the entity. */
    externalId: string;
    createdAt: string;
    /** Set when the external ID was rotated or superseded. */
    rotatedAt?: string;
  }>;
}
