# Generated from /schemas/audit-record.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class AuditRecordActor(TypedDict, total=False):
    kind: Literal["person", "agent", "automation", "system"]
    id: str


class AuditRecordError(TypedDict, total=False):
    code: NotRequired[str]
    message: NotRequired[str]
    stack: NotRequired[str]


class AuditRecord(TypedDict, total=False):
    """One row per orchestration action. Loose schema for what happened in the runtime — debugging, post-hoc reasoning, compliance."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["AuditRecord"]
    id: str
    actor: "AuditRecordActor"
    """Free-text action label. By convention, lowercase + dotted segments."""
    action: str
    module: NotRequired[str]
    workflow: NotRequired[str]
    agent: NotRequired[str]
    startedAt: str
    completedAt: NotRequired[str]
    durationMs: NotRequired[int]
    status: Literal["success", "failure", "partial", "dry-run", "skipped"]
    dryRun: NotRequired[bool]
    """Input payload, redacted as required by policy."""
    input: NotRequired[Any]
    """Output payload or summary."""
    output: NotRequired[Any]
    error: NotRequired["AuditRecordError"]
    correlationId: NotRequired[str]
    causationId: NotRequired[str]
    """External system the action targeted, by canonical name."""
    targetSystem: NotRequired[str]
    """W3C trace ID (32 hex chars) joining this audit row to the typed-event ledger."""
    traceId: NotRequired[str]
    """W3C span ID (16 hex chars) of the step span that produced this row."""
    spanId: NotRequired[str]
