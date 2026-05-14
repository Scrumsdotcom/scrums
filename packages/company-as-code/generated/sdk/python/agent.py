# Generated from /schemas/agent.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class AgentEscalation(TypedDict, total=False):
    """Required when autonomy is 'escalated'."""
    threshold: NotRequired[str]
    to: NotRequired[str]


class AgentInputsItem(TypedDict, total=False):
    name: str
    type: str
    # "from": NotRequired[str]  (reserved word — access via dict)


class AgentOutputsItem(TypedDict, total=False):
    name: str
    type: str
    emitsEvent: NotRequired[str]


class AgentObservability(TypedDict, total=False):
    dashboards: NotRequired[List[str]]
    alerts: NotRequired[List[str]]
    auditTopic: NotRequired[str]


class AgentContactsItem(TypedDict, total=False):
    role: str
    person: NotRequired[str]


class Agent(TypedDict, total=False):
    """Autonomous execution unit. Declared in a module manifest and elaborated in /agents/<name>.yaml."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["Agent"]
    name: str
    """Owning module path (must match the agent's declaration in that module's manifest)."""
    module: str
    purpose: str
    """Abstract runtime label (e.g. 'llm', 'scheduled-job', 'event-handler'). No vendor names."""
    runtime: NotRequired[str]
    """cron expression or the literal string 'on-demand'."""
    schedule: NotRequired[str]
    cadence: Literal["realtime", "minutely", "hourly", "daily", "weekly", "monthly", "on-demand", "event-driven"]
    autonomy: Literal["autonomous", "human-gated", "escalated"]
    """Required when autonomy is 'escalated'."""
    escalation: NotRequired["AgentEscalation"]
    inputs: NotRequired[List["AgentInputsItem"]]
    outputs: NotRequired[List["AgentOutputsItem"]]
    """Named tools / capabilities scoped to this agent."""
    tools: NotRequired[List[str]]
    """Tier-3 skills (by name) this agent is authorized to invoke. See /company/skills."""
    skills: NotRequired[List[str]]
    """Pointer into /company/memory namespace this agent reads/writes."""
    memoryScope: NotRequired[str]
    observability: NotRequired["AgentObservability"]
    invariants: NotRequired[List[str]]
    primaryUsers: NotRequired[List[str]]
    contacts: NotRequired[List["AgentContactsItem"]]
