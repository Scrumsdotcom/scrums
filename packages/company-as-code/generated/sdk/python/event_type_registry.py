# Generated from /schemas/event-type-registry.schema.json, do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

# Dotted, lowercase + snake_case event type. Leading segment is the emitting domain or module. Kept byte-identical with event.schema.json#/$defs/eventType (enforced by test).
EventType = str


class EventTypeRegistryEventsItem(TypedDict):
    """Dotted, lowercase + snake_case. Leading segment is the emitting domain or module."""
    type: "EventType"
    description: str
    emittingModule: str
    """Optional repo-relative path to the JSON-Schema-flavoured payload definition."""
    payloadSchema: NotRequired[str]
    status: Literal["experimental", "stable", "deprecated"]
    deprecatedAt: NotRequired[str]
    removeAfter: NotRequired[str]


class EventTypeRegistry(TypedDict):
    """The enum-controlled registry of typed event names. One document for the company. Adding a new type requires a schema migration and an ADR."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["EventTypeRegistry"]
    """Registry schema version. Bumped only via ADR + migration."""
    version: int
    events: List["EventTypeRegistryEventsItem"]
