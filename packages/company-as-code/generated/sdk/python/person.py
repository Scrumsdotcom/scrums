# Generated from /schemas/person.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class PersonRolesItem(TypedDict, total=False):
    title: str
    organization: NotRequired[str]
    since: NotRequired[str]
    until: NotRequired[str]


class PersonExternalIdsItem(TypedDict, total=False):
    system: str
    id: str
    addedAt: NotRequired[str]


class PersonTombstone(TypedDict, total=False):
    """Set when status transitions to soft-deleted."""
    deletedAt: NotRequired[str]
    reason: NotRequired[str]
    mergedInto: NotRequired[str]


class Person(TypedDict, total=False):
    """Canonical actor identity. Employee, contractor, supplier, AI operator, or agent identity."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["Person"]
    """Permanent internal ID."""
    canonicalId: str
    displayName: str
    type: Literal["employee", "contractor", "supplier", "ai-operator", "agent-identity", "service-account"]
    status: Literal["proposed", "active", "leave", "offboarded", "terminated", "soft-deleted"]
    primaryEmail: NotRequired[str]
    organizations: NotRequired[List[str]]
    roles: NotRequired[List["PersonRolesItem"]]
    """Agents this identity operates on behalf of (for ai-operator and agent-identity types)."""
    agentBindings: NotRequired[List[str]]
    externalIds: NotRequired[List["PersonExternalIdsItem"]]
    """Set when status transitions to soft-deleted."""
    tombstone: NotRequired["PersonTombstone"]
