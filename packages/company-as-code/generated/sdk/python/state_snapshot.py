# Generated from /schemas/state-snapshot.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class StateSnapshotEntitiesItem(TypedDict, total=False):
    """Permanent internal ID. Never changes for the lifetime of the entity."""
    canonicalId: str
    """Canonical entity type, e.g. 'customer', 'task'."""
    kind: str
    """L1 universal lifecycle bucket on the canonical state ladder."""
    l1Bucket: str
    createdAt: str
    """Set when soft-deleted. Records are never hard-deleted."""
    tombstonedAt: NotRequired[str]
    tombstoneReason: NotRequired[str]
    """Canonical ID this entity was merged into. Merges are reversible pointers."""
    mergedInto: NotRequired[str]


class StateSnapshotMappingsItem(TypedDict, total=False):
    """The canonical entity this mapping points at."""
    canonicalId: str
    """Canonical name of the external system, e.g. 'crm'."""
    system: str
    """The ID that external system assigned to the entity."""
    externalId: str
    createdAt: str
    """Set when the external ID was rotated or superseded."""
    rotatedAt: NotRequired[str]


class StateSnapshot(TypedDict, total=False):
    """An immutable, versioned checkpoint of the company's canonical coordination state — canonical entity IDs and their evolving external system mappings. Snapshots make rollback to a known-good state a first-class runtime operation. The append-only audit log and typed-event ledger are never rewound; a rollback rolls history forward by emitting a coordination.state_rolled_back event."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["StateSnapshot"]
    """Snapshot ID, e.g. 'snap-01jh...'."""
    id: str
    """Optional human label, e.g. 'pre-billing-migration'."""
    label: NotRequired[str]
    createdAt: str
    """sha256 of the canonical-JSON snapshot content. Equal hashes captured identical state."""
    contentHash: str
    entityCount: int
    mappingCount: int
    """Every canonical entity at snapshot time."""
    entities: List["StateSnapshotEntitiesItem"]
    """Every external-system mapping at snapshot time."""
    mappings: List["StateSnapshotMappingsItem"]
