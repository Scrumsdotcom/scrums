# Generated from /schemas/manifest.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class ModuleManifestOwns(TypedDict, total=False):
    """What this module is canonically responsible for."""
    tables: NotRequired[List[str]]
    agents: NotRequired[List[str]]
    apps: NotRequired[List[str]]
    workflows: NotRequired[List[str]]
    dashboards: NotRequired[List[str]]
    schemas: NotRequired[List[str]]
    policies: NotRequired[List[str]]
    playbooks: NotRequired[List[str]]


class ModuleManifestConsumesItem(TypedDict, total=False):
    interface: str
    # "from": str  (reserved word — access via dict)
    usage: NotRequired[str]


class ModuleManifestExposesItem(TypedDict, total=False):
    interface: str
    stability: Literal["experimental", "stable", "deprecated"]
    description: NotRequired[str]


class ModuleManifestAgentsItem(TypedDict, total=False):
    name: str
    purpose: str
    runtime: NotRequired[str]
    """cron expression or 'on-demand'."""
    schedule: NotRequired[str]
    cadence: Literal["realtime", "minutely", "hourly", "daily", "weekly", "monthly", "on-demand", "event-driven"]
    autonomy: Literal["autonomous", "human-gated", "escalated"]
    primaryUsers: NotRequired[List[str]]
    outputs: NotRequired[List[str]]


class ModuleManifestContactsItem(TypedDict, total=False):
    role: str
    person: NotRequired[str]
    team: NotRequired[str]


class ModuleManifest(TypedDict, total=False):
    """Declarative source of truth for a module. Every module at every level of the organizational graph has a manifest.yaml at its root."""
    """Schema contract version."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["Manifest"]
    """Kebab-case module identifier, unique within the parent domain."""
    name: str
    """Canonical domain this module belongs to."""
    domain: Literal["executive", "finance-ops", "product-operations", "sales-marketing", "framework"]
    """Optional parent module path (e.g. domains/product-operations/platform)."""
    parent: NotRequired[str]
    """Semantic version of the module manifest."""
    version: NotRequired[str]
    """Module lifecycle stage."""
    lifecycle: Literal["planning", "hardening", "stable", "agent-ready", "deprecated"]
    """One-sentence purpose statement for the module."""
    purpose: NotRequired[str]
    """What this module is canonically responsible for."""
    owns: "ModuleManifestOwns"
    """Named interfaces this module reads from other modules."""
    consumes: NotRequired[List["ModuleManifestConsumesItem"]]
    """Named interfaces this module offers to others."""
    exposes: NotRequired[List["ModuleManifestExposesItem"]]
    """Autonomous units declared by this module."""
    agents: NotRequired[List["ModuleManifestAgentsItem"]]
    """Declarative properties that must remain true."""
    invariants: NotRequired[List[str]]
    """Humans accountable for this module."""
    contacts: List["ModuleManifestContactsItem"]
    """References to runbooks, dashboards, plans."""
    links: NotRequired[Dict[str, str]]
