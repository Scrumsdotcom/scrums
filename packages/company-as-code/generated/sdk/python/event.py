# Generated from /schemas/event.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class EventEntity(TypedDict, total=False):
    canonicalId: str
    """Canonical entity type, e.g. 'task', 'initiative', 'customer'."""
    kind: str


class EventActor(TypedDict, total=False):
    kind: Literal["person", "agent", "automation", "system"]
    id: str


class EventSource(TypedDict, total=False):
    module: NotRequired[str]
    workflow: NotRequired[str]
    agent: NotRequired[str]


class Event(TypedDict, total=False):
    """Typed event ledger row. One row per state transition on a canonical entity. Event types are enum-controlled."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["Event"]
    """Globally unique event ID (ULID/UUID)."""
    id: str
    """Enum-typed event name, e.g. 'task.state_changed'. New types require a schema migration."""
    type: str
    entity: "EventEntity"
    occurredAt: str
    recordedAt: NotRequired[str]
    actor: "EventActor"
    """Type-specific payload. Schema governed by the event type registry."""
    payload: NotRequired[Dict[str, Any]]
    # "from": NotRequired[str]  (reserved word — access via dict)
    """New state (for state-transition events)."""
    to: NotRequired[str]
    correlationId: NotRequired[str]
    causationId: NotRequired[str]
    source: NotRequired["EventSource"]
    schemaVersion: NotRequired[str]
    """W3C trace ID (32 hex chars) joining this event to the audit log."""
    traceId: NotRequired[str]
    """W3C span ID (16 hex chars) of the step span that emitted this event."""
    spanId: NotRequired[str]
