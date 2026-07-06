# Generated from /schemas/automation.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class AutomationOwner(TypedDict):
    module: str
    person: NotRequired[str]


class AutomationInputsItem(TypedDict):
    name: str
    type: str
    required: NotRequired[bool]
    description: NotRequired[str]


class AutomationOutputsItem(TypedDict):
    name: str
    type: str
    description: NotRequired[str]


class AutomationFailureModesItem(TypedDict):
    description: str
    behavior: str


class AutomationObservability(TypedDict):
    auditTopic: str
    dashboards: NotRequired[List[str]]
    alerts: NotRequired[List[str]]


class Automation(TypedDict):
    """Deterministic execution unit between the agent layer and the integration layer. Every automation supports dryRun, declares its mutation surface, and lists known failure modes."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["Automation"]
    name: str
    owner: "AutomationOwner"
    purpose: str
    """Abstract runtime label (scheduled-job, event-handler, webhook). No vendor names."""
    runtime: NotRequired[str]
    """cron expression or 'on-demand'."""
    schedule: NotRequired[str]
    cadence: Literal["realtime", "minutely", "hourly", "daily", "weekly", "monthly", "on-demand", "event-driven"]
    """Typed inputs. A `dryRun: boolean` input is required by convention; the cross-document validator enforces."""
    inputs: List["AutomationInputsItem"]
    outputs: NotRequired[List["AutomationOutputsItem"]]
    """Canonical tables or integrations this automation writes to. Empty array means read-only."""
    mutates: NotRequired[List[Dict[str, Any]]]
    invariants: List[str]
    failureModes: NotRequired[List["AutomationFailureModesItem"]]
    observability: NotRequired["AutomationObservability"]
