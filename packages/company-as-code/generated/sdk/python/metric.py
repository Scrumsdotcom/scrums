# Generated from /schemas/metric.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class MetricOwner(TypedDict, total=False):
    module: str
    person: NotRequired[str]


class MetricLineageItem(TypedDict, total=False):
    source: str
    field: NotRequired[str]
    transformation: NotRequired[str]


class MetricFreshness(TypedDict, total=False):
    """ISO 8601 duration."""
    expectedLag: str
    """ISO 8601 duration. Past this, alert."""
    maxLag: NotRequired[str]
    lastObservedAt: NotRequired[str]


class MetricThresholdsItem(TypedDict, total=False):
    level: Literal["info", "warning", "critical"]
    comparator: Literal["gte", "lte", "gt", "lt", "eq", "neq"]
    value: Union[float, str]


class MetricHistory(TypedDict, total=False):
    """ISO 8601 duration."""
    retention: NotRequired[str]
    grain: NotRequired[Literal["minute", "hour", "day", "week", "month"]]


class Metric(TypedDict, total=False):
    """Typed observable quantity with declared ownership, lineage, freshness, formula, and thresholds."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["Metric"]
    id: str
    name: str
    description: NotRequired[str]
    owner: "MetricOwner"
    type: Literal["counter", "gauge", "histogram", "ratio", "percentage", "currency", "duration", "boolean"]
    """Human-readable unit, e.g. 'USD', 'requests/sec', 'days'."""
    unit: str
    """Plain-language or expression describing how the metric is computed."""
    formula: NotRequired[str]
    """Upstream sources the metric is derived from."""
    lineage: NotRequired[List["MetricLineageItem"]]
    freshness: "MetricFreshness"
    thresholds: NotRequired[List["MetricThresholdsItem"]]
    dashboards: NotRequired[List[str]]
    alerts: NotRequired[List[str]]
    history: NotRequired["MetricHistory"]
