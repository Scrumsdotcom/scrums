# Generated from /schemas/escalation-policy.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class Severity(TypedDict):
    description: str
    """ISO 8601 duration."""
    acknowledgeWithin: str
    """ISO 8601 duration or the literal 'best-effort' / 'not-required'."""
    incidentCommanderWithin: NotRequired[str]
    pageMode: Literal["continuous-until-ack", "notify", "none"]


class EscalationPolicySeverities(TypedDict):
    # "sev-1": "Severity"  (reserved word — access via dict)
    # "sev-2": "Severity"  (reserved word — access via dict)
    # "sev-3": "Severity"  (reserved word — access via dict)
    # "sev-4": "Severity"  (reserved word — access via dict)
    pass


class EscalationPolicyRolesItemFallbackItem(TypedDict):
    role: str


class EscalationPolicyRolesItem(TypedDict):
    role: str
    description: str
    fallback: NotRequired[List["EscalationPolicyRolesItemFallbackItem"]]


class EscalationPolicyDefaults(TypedDict):
    escalatedAgentThreshold: NotRequired[str]
    escalatedAgentRecipient: NotRequired[str]


class EscalationPolicyChannelsItem(TypedDict):
    kind: Literal["page", "chat", "email", "sms", "webhook"]
    """Pointer to a /company/integrations/<name> manifest (vendor-neutral)."""
    target: str
    forSeverities: List[Literal["sev-1", "sev-2", "sev-3", "sev-4"]]


class EscalationPolicy(TypedDict):
    """Severity → SLA mapping; on-call role bindings; vendor-neutral channel routing. Singleton runtime configuration document."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["EscalationPolicy"]
    version: int
    severities: "EscalationPolicySeverities"
    roles: List["EscalationPolicyRolesItem"]
    defaults: NotRequired["EscalationPolicyDefaults"]
    channels: List["EscalationPolicyChannelsItem"]
