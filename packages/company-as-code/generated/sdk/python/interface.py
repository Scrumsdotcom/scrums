# Generated from /schemas/interface.schema.json, do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class InterfaceOperationsItem(TypedDict):
    name: str
    kind: Literal["read", "write", "stream", "rpc"]
    """Schema reference for input payload."""
    input: NotRequired[str]
    """Schema reference for output payload."""
    output: NotRequired[str]
    idempotent: NotRequired[bool]
    hitl: NotRequired[bool]
    dryRunSupported: NotRequired[bool]


class Interface(TypedDict):
    """Declared interface a module exposes to other modules. The contract; the code implements it."""
    apiVersion: Literal["company-as-code/v1alpha1"]
    kind: Literal["Interface"]
    name: str
    """Module that owns this interface."""
    owner: str
    description: NotRequired[str]
    stability: Literal["experimental", "stable", "deprecated"]
    version: NotRequired[str]
    transport: NotRequired[Literal["in-process", "http", "rpc", "event", "file", "queue"]]
    operations: List["InterfaceOperationsItem"]
    """Modules that have declared a consumes-entry against this interface."""
    consumers: NotRequired[List[str]]
    deprecatedAt: NotRequired[str]
    removeAfter: NotRequired[str]
