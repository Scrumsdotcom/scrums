# Generated from /schemas/hub-module.schema.json, do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class HubModuleProvenance(TypedDict):
    """Where the module came from. The hub is open-source and attribution matters."""
    """Contributing person or organization."""
    author: str
    """SPDX license identifier, e.g. 'Apache-2.0'."""
    license: str
    """Upstream repository or homepage."""
    sourceUrl: NotRequired[str]
    maintainers: NotRequired[List[str]]


class HubModuleScaffoldsItem(TypedDict):
    """Path relative to payload/, e.g. 'manifest.yaml'."""
    path: str
    """The CaC primitive kind this file declares, or 'Doc' for prose / 'Asset' for other files."""
    kind: str
    description: NotRequired[str]


class HubModuleConsumesItem(TypedDict):
    interface: str
    reason: NotRequired[str]


class HubModule(TypedDict):
    """Metadata for a community-contributed, importable module in the CaC-Hub. A hub module bundles a validated payload (manifest, workflows, agents, policies) that `cac hub add` scaffolds into a company's /company tree. The hub is how a company forks or imports shared building blocks while keeping every artefact schema-valid."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["HubModule"]
    """Kebab-case hub module identifier, unique within the hub."""
    name: str
    """Semantic version of the hub module."""
    version: str
    """One-sentence description of what this module gives a company."""
    summary: str
    """Longer prose: what the module contains, when to import it, what to fill in after."""
    description: NotRequired[str]
    """What kind of building block this is."""
    category: Literal["integration", "domain", "policy", "workflow-pack", "observability", "other"]
    """How battle-tested the module is. New community contributions start experimental."""
    maturity: Literal["experimental", "beta", "stable"]
    """The CaC apiVersion this module's payload targets."""
    frameworkVersion: NotRequired[Literal["company-as-code/v1"]]
    """Where the module came from. The hub is open-source and attribution matters."""
    provenance: "HubModuleProvenance"
    """Default domain the payload manifest belongs to. `cac hub add` derives the install path from this unless --into is given."""
    targetDomain: NotRequired[Literal["executive", "finance-ops", "product-operations", "sales-marketing", "framework"]]
    """Every file in payload/ that `cac hub add` will write into the company tree."""
    scaffolds: List["HubModuleScaffoldsItem"]
    """Framework interfaces the payload expects to already exist in the importing company. `cac hub add` warns when these are unmet."""
    consumes: NotRequired[List["HubModuleConsumesItem"]]
    tags: NotRequired[List[str]]
    """Other hub module names that pair well with this one."""
    relatedModules: NotRequired[List[str]]
