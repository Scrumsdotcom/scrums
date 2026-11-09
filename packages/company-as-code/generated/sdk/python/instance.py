# Generated from /schemas/instance.schema.json, do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class InstanceFramework(TypedDict):
    """The framework release this tree is on. In a fork, it is updated only by 'cac upgrade'."""
    version: str
    """Where the framework comes from. Informational."""
    upstream: NotRequired[str]


class InstanceDeviationsItem(TypedDict):
    """Repo-relative path of the framework file."""
    path: str
    """Why the fork carries this change instead of upstreaming it."""
    reason: str
    """Repo-relative path of the fork's decision record, usually under company/decisions/."""
    decision: NotRequired[str]


class Instance(TypedDict):
    """What this repository is, declared once at the root in cac.yaml. Upstream is the Company-as-Code project itself; a fork is a company running on it. The role decides how the framework/instance boundary is checked, and the framework pin records which upstream release a fork is on."""
    apiVersion: Literal["company-as-code/v1alpha1"]
    kind: Literal["Instance"]
    """Human-readable name of the project or company."""
    name: str
    """'upstream' publishes framework.lock.json from its own tree. 'fork' checks its tree against the lock it received."""
    role: Literal["upstream", "fork"]
    """Short prefix this instance puts on anything that could collide with upstream, such as hub module names. Upstream uses 'cac'."""
    namespace: str
    framework: "InstanceFramework"
    """Framework files this fork has deliberately changed. A declared deviation is reported but does not fail 'cac boundary check'; an undeclared one does. Upgrades stop at every deviation for a human to resolve."""
    deviations: NotRequired[List["InstanceDeviationsItem"]]
