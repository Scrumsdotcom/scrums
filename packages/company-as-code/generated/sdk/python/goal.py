# Generated from /schemas/goal.schema.json, do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class GoalOwner(TypedDict):
    kind: Literal["person", "team", "agent", "module"]
    id: str


class GoalTarget(TypedDict):
    value: Union[float, str]
    unit: NotRequired[str]
    comparator: Literal["gte", "lte", "gt", "lt", "eq", "neq", "between"]
    lower: NotRequired[Union[float, str]]
    upper: NotRequired[Union[float, str]]


class GoalHorizon(TypedDict):
    period: NotRequired[Literal["weekly", "monthly", "quarterly", "yearly", "rolling"]]
    start: NotRequired[str]
    end: NotRequired[str]


class Goal(TypedDict):
    """Measurable objective: KPI, OKR, SLA, or metric target. Goals are owned and time-bounded."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["Goal"]
    id: str
    title: str
    description: NotRequired[str]
    type: Literal["kpi", "okr", "sla", "target", "guardrail"]
    owner: "GoalOwner"
    """Metric ID this goal targets."""
    metric: str
    target: "GoalTarget"
    horizon: NotRequired["GoalHorizon"]
    initiatives: NotRequired[List[str]]
    status: NotRequired[Literal["draft", "active", "on-track", "at-risk", "off-track", "achieved", "missed", "archived"]]
    lastReviewedAt: NotRequired[str]
