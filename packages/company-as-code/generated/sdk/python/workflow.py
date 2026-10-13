# Generated from /schemas/workflow.schema.json, do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class WorkflowTrigger(TypedDict):
    kind: Literal["event", "schedule", "human", "webhook", "manual"]
    event: NotRequired[str]
    schedule: NotRequired[str]
    actor: NotRequired[str]


class WorkflowInputsItem(TypedDict):
    name: str
    type: str
    required: NotRequired[bool]


class WorkflowOutputsItem(TypedDict):
    name: str
    type: str


class WorkflowStepsItemBranchesItem(TypedDict):
    when: str
    next: str


class WorkflowStepsItem(TypedDict):
    id: str
    kind: Literal["agent", "automation", "human-approval", "wait", "branch", "emit-event", "external-call", "dry-run", "live-write"]
    agent: NotRequired[str]
    automation: NotRequired[str]
    approver: NotRequired[str]
    """When the step writes to an external surface, require a dry-run predecessor."""
    dryRunRequired: NotRequired[bool]
    """Step requires a human-in-the-loop confirmation."""
    hitl: NotRequired[bool]
    emitsEvent: NotRequired[str]
    onFailure: NotRequired[Literal["retry", "escalate", "abort"]]
    retries: NotRequired[int]
    """ISO 8601 duration."""
    timeout: NotRequired[str]
    branches: NotRequired[List["WorkflowStepsItemBranchesItem"]]


class WorkflowObservability(TypedDict):
    dashboards: NotRequired[List[str]]
    metrics: NotRequired[List[str]]


class Workflow(TypedDict):
    """Multi-step orchestration definition. May be triggered by event, schedule, or human action."""
    apiVersion: Literal["company-as-code/v1alpha1"]
    kind: Literal["Workflow"]
    name: str
    module: str
    purpose: str
    trigger: "WorkflowTrigger"
    inputs: NotRequired[List["WorkflowInputsItem"]]
    outputs: NotRequired[List["WorkflowOutputsItem"]]
    steps: List["WorkflowStepsItem"]
    invariants: NotRequired[List[str]]
    """If true, the workflow as a whole is human-gated. Scheduled triggers fail validation when hitl is true."""
    hitl: NotRequired[bool]
    observability: NotRequired["WorkflowObservability"]
