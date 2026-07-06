# Generated from /schemas/autonomy-policy.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class Class(TypedDict):
    description: str
    schedulingAllowed: bool
    requiresHumanApproval: bool
    requiresEscalationBlock: NotRequired[bool]
    permittedActions: NotRequired[List[str]]
    forbiddenActions: NotRequired[List[str]]
    notes: NotRequired[str]


class AutonomyPolicyClasses(TypedDict):
    autonomous: "Class"
    # "human-gated": "Class"  (reserved word — access via dict)
    escalated: "Class"


class AutonomyPolicyPromotionFromHumanGatedToAutonomous(TypedDict):
    requires: NotRequired[Dict[str, Union[str, bool, float]]]


class AutonomyPolicyPromotionFromAutonomousToHumanGated(TypedDict):
    requires: NotRequired[Dict[str, Union[str, bool, float]]]
    notes: NotRequired[str]


class AutonomyPolicyPromotion(TypedDict):
    fromHumanGatedToAutonomous: NotRequired["AutonomyPolicyPromotionFromHumanGatedToAutonomous"]
    fromAutonomousToHumanGated: NotRequired["AutonomyPolicyPromotionFromAutonomousToHumanGated"]


class AutonomyPolicyPreflightItem(TypedDict):
    check: str
    onFailure: Literal["refuse", "warn", "audit-only"]


class AutonomyPolicy(TypedDict):
    """Operational expression of the three autonomy classes. Singleton runtime configuration document. The CLI validates that an agent's declared autonomy is consistent with this policy."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["AutonomyPolicy"]
    version: int
    classes: "AutonomyPolicyClasses"
    promotion: NotRequired["AutonomyPolicyPromotion"]
    preflight: NotRequired[List["AutonomyPolicyPreflightItem"]]
