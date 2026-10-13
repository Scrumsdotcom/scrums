# Generated from /schemas/dashboard.schema.json, do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class DashboardOwner(TypedDict):
    module: str
    person: NotRequired[str]


class DashboardPanelsItemThresholdsWarning(TypedDict):
    comparator: Literal["gt", "gte", "lt", "lte", "eq", "neq"]
    value: Union[float, str]


class DashboardPanelsItemThresholdsCritical(TypedDict):
    comparator: Literal["gt", "gte", "lt", "lte", "eq", "neq"]
    value: Union[float, str]


class DashboardPanelsItemThresholds(TypedDict):
    warning: NotRequired["DashboardPanelsItemThresholdsWarning"]
    critical: NotRequired["DashboardPanelsItemThresholdsCritical"]


class DashboardPanelsItem(TypedDict):
    id: str
    title: str
    type: Literal["stat", "line", "bar", "percentage", "counter", "histogram", "list", "markdown", "composite"]
    """Metric ID or interface-relative metric reference."""
    metric: NotRequired[str]
    """Alternative to metric: an event-stream path or interface reference."""
    source: NotRequired[str]
    """ISO 8601 duration when the panel shows a windowed view."""
    horizon: NotRequired[str]
    annotation: NotRequired[str]
    thresholds: NotRequired["DashboardPanelsItemThresholds"]
    """For composite panels: sub-panel IDs."""
    elements: NotRequired[List[str]]


class DashboardAlertsItem(TypedDict):
    id: str
    description: str
    severity: Literal["sev-1", "sev-2", "sev-3", "sev-4"]
    """Role identifier resolved against escalation-policy.yaml."""
    routing: str


class Dashboard(TypedDict):
    """Read-only observability surface. Declares the metrics, audience, refresh cadence, and panel layout. Dashboards never trigger writes; control surfaces are workflows."""
    apiVersion: Literal["company-as-code/v1alpha1"]
    kind: Literal["Dashboard"]
    """Kebab-case identifier, globally unique."""
    name: str
    owner: "DashboardOwner"
    purpose: str
    """Role or canonical Person IDs that consume this dashboard."""
    audience: List[str]
    refresh: Literal["realtime", "minutely", "hourly", "daily", "on-demand"]
    panels: List["DashboardPanelsItem"]
    alerts: NotRequired[List["DashboardAlertsItem"]]
    invariants: NotRequired[List[str]]
