# Generated from /schemas/organization.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class OrganizationLifecycle(TypedDict, total=False):
    createdAt: NotRequired[str]
    dissolvedAt: NotRequired[str]
    mergedInto: NotRequired[str]


class OrganizationExternalIdsItem(TypedDict, total=False):
    """Canonical name of the external system."""
    system: str
    id: str
    addedAt: NotRequired[str]
    rotatedAt: NotRequired[str]


class Organization(TypedDict, total=False):
    """Canonical organizational unit — company, business unit, team, pod, department. Forms the executable org graph."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["Organization"]
    """Permanent internal ID. Never changes for the lifetime of the entity."""
    canonicalId: str
    name: str
    type: Literal["company", "business-unit", "department", "team", "pod", "guild", "circle"]
    domain: NotRequired[Literal["executive", "finance-ops", "product-operations", "sales-marketing", "cross-domain"]]
    """Canonical ID of parent organization."""
    parent: NotRequired[str]
    """Path to the module manifest representing this org unit in the cognition tree."""
    module: NotRequired[str]
    status: Literal["proposed", "active", "frozen", "dissolved", "merged"]
    lifecycle: NotRequired["OrganizationLifecycle"]
    members: NotRequired[List[str]]
    leads: NotRequired[List[str]]
    mission: NotRequired[str]
    externalIds: NotRequired[List["OrganizationExternalIdsItem"]]
