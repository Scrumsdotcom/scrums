# Generated from /schemas/initiative.schema.json, do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class InitiativeOwner(TypedDict):
    kind: Literal["person", "team", "agent"]
    id: str


class InitiativeRisksItem(TypedDict):
    description: str
    severity: Literal["low", "medium", "high", "critical"]
    mitigation: NotRequired[str]


class InitiativeMilestonesItem(TypedDict):
    name: str
    date: str
    achieved: NotRequired[bool]


class Initiative(TypedDict):
    """Strategic change, time-bounded and decomposable. Initiatives roll up into goals and decompose into tasks."""
    apiVersion: Literal["company-as-code/v1alpha1"]
    kind: Literal["Initiative"]
    id: str
    title: str
    summary: NotRequired[str]
    status: Literal["proposed", "approved", "active", "paused", "complete", "abandoned"]
    owner: "InitiativeOwner"
    domain: NotRequired[Literal["executive", "finance-ops", "product-operations", "sales-marketing", "cross-domain"]]
    startDate: str
    targetDate: NotRequired[str]
    completedAt: NotRequired[str]
    """Goal IDs this initiative advances."""
    goals: NotRequired[List[str]]
    """Metric IDs the initiative is measured against."""
    metrics: NotRequired[List[str]]
    tasks: NotRequired[List[str]]
    """Modules that participate in delivery."""
    modules: NotRequired[List[str]]
    risks: NotRequired[List["InitiativeRisksItem"]]
    milestones: NotRequired[List["InitiativeMilestonesItem"]]
