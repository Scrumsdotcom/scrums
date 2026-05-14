# Generated from /schemas/task.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class TaskOwner(TypedDict, total=False):
    kind: Literal["person", "agent", "team"]
    id: str


class TaskSla(TypedDict, total=False):
    """ISO 8601 duration."""
    respondWithin: NotRequired[str]
    """ISO 8601 duration."""
    resolveWithin: NotRequired[str]


class TaskEscalation(TypedDict, total=False):
    """ISO 8601 duration before escalation."""
    after: NotRequired[str]
    to: NotRequired[str]


class TaskAutomation(TypedDict, total=False):
    workflow: NotRequired[str]
    agent: NotRequired[str]
    trigger: NotRequired[str]


class TaskApprovalsItem(TypedDict, total=False):
    role: str
    actor: NotRequired[str]
    decidedAt: NotRequired[str]
    decision: NotRequired[Literal["approved", "rejected", "pending"]]


class TaskHistoryItem(TypedDict, total=False):
    state: str
    at: str
    actor: NotRequired[str]
    note: NotRequired[str]


class Task(TypedDict, total=False):
    """Canonical unit of execution. Tasks are state machines with typed transitions."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["Task"]
    """Canonical task ID, e.g. TASK-FIN-0042. Module prefix is opaque."""
    id: str
    title: str
    description: NotRequired[str]
    """Owning module path."""
    module: NotRequired[str]
    state: Literal["backlog", "planned", "active", "blocked", "review", "completed", "archived", "failed"]
    owner: "TaskOwner"
    priority: NotRequired[Literal["p0", "p1", "p2", "p3"]]
    dueAt: NotRequired[str]
    sla: NotRequired["TaskSla"]
    dependencies: NotRequired[List[str]]
    subtasks: NotRequired[List[str]]
    escalation: NotRequired["TaskEscalation"]
    automation: NotRequired["TaskAutomation"]
    approvals: NotRequired[List["TaskApprovalsItem"]]
    labels: NotRequired[List[str]]
    createdAt: NotRequired[str]
    updatedAt: NotRequired[str]
    history: NotRequired[List["TaskHistoryItem"]]
