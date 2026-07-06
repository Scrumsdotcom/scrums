# Generated from /schemas/shadow-enrollment.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class ShadowEnrollmentEvidence(TypedDict):
    """Aggregated Reliability Evidence over the shadow ledger."""
    """Whole days since enrollment."""
    shadowDays: int
    """Shadow invocations recorded."""
    totalRuns: int
    """Runs that have a human-comparison observation."""
    observedRuns: int
    """Observed runs where the projection matched the human action."""
    matchedRuns: int
    """matchedRuns / observedRuns, or 0 when nothing has been observed."""
    agreementRate: float
    """Distinct W3C trace IDs the shadow runs span."""
    distinctTraces: int


class ShadowEnrollmentPromotionGate(TypedDict):
    """Evaluation of the AutonomyPolicy promotion requirements against the evidence."""
    """Every automatically-checkable requirement is met."""
    autoMet: NotRequired[bool]
    unmetAuto: NotRequired[List[str]]
    manualGates: NotRequired[List[str]]


class ShadowEnrollment(TypedDict):
    """An agent's enrollment in Shadow Mode plus the Reliability Evidence accumulated against it. A shadow agent runs in perpetual dry-run alongside human operators; every invocation is a row of evidence. When the evidence clears the AutonomyPolicy's promotion bar, an ADR proposal promotes the agent to autonomous."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["ShadowEnrollment"]
    """Canonical agent name enrolled in shadow mode."""
    agent: str
    enrolledAt: str
    """shadow = actively shadowing; promoted = an accepted ADR moved it to autonomous; withdrawn = removed from shadow mode."""
    status: Literal["shadow", "promoted", "withdrawn"]
    statusChangedAt: NotRequired[str]
    """Aggregated Reliability Evidence over the shadow ledger."""
    evidence: "ShadowEnrollmentEvidence"
    """Evaluation of the AutonomyPolicy promotion requirements against the evidence."""
    promotionGate: NotRequired["ShadowEnrollmentPromotionGate"]
