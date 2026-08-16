# Generated from /schemas/control.schema.json, do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class ControlOwner(TypedDict):
    kind: Literal["person", "team", "module"]
    id: str


class ControlVerification(TypedDict):
    """How the control is proven to be working. A control nobody checks is a claim, not a control."""
    """'automated' requires a `check` pointing at something a machine runs."""
    method: Literal["automated", "manual", "hybrid"]
    """Where verification executes. Vendor-neutral by construction."""
    surface: Literal["schema", "ci", "runtime-host", "scheduled-job", "human-review", "external-audit"]
    """Repo-relative pointer to the runnable check (file, function, workflow, or CLI command). Required when method is 'automated'."""
    check: NotRequired[str]
    frequency: Literal["continuous", "on-change", "daily", "weekly", "monthly", "quarterly", "annually"]
    """What happens when the check fails: block the merge, page the owner, open a task, raise a finding."""
    failureMode: NotRequired[str]


class ControlEvidenceItem(TypedDict):
    source: Literal["audit-log", "event-ledger", "ci-run", "dashboard", "document", "external-system"]
    reference: str
    """How long this evidence is kept, e.g. '7y'."""
    retention: NotRequired[str]


class Control(TypedDict):
    """A verifiable mechanism that keeps one or more Requirements true, plus the evidence it produces. A Control declares what it implements, how it is checked, how often, and where the proof lands. Controls whose verification is 'automated' point at a runnable check; controls that are only prose are declared 'manual' and carry a review cadence."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["Control"]
    """Canonical, permanent control ID (e.g. CTRL-HITL-EXTERNAL-WRITES)."""
    id: str
    title: str
    description: str
    """The Requirements this control covers. This is the single writer of the requirement-to-control edge; Requirements never list their controls."""
    implements: List[str]
    owner: "ControlOwner"
    """Module paths this control operates on. Empty means company-wide."""
    appliesTo: NotRequired[List[str]]
    """How the control is proven to be working. A control nobody checks is a claim, not a control."""
    verification: "ControlVerification"
    """Where the proof of operation accumulates. An auditor should be able to follow each entry without asking a human where to look."""
    evidence: NotRequired[List["ControlEvidenceItem"]]
    severity: Literal["low", "medium", "high", "critical"]
    """'operating' asserts the control has run at least once and produced evidence."""
    status: Literal["designed", "implemented", "operating", "failing", "retired"]
    """Date the control was last confirmed to be working. Stale dates are a doctor finding, not a silent pass."""
    lastVerified: NotRequired[str]
    """Controls this one substitutes for when the primary mechanism is unavailable."""
    compensatingFor: NotRequired[List[str]]
    tags: NotRequired[List[str]]
