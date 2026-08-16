# Generated from /schemas/integration.schema.json, do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class IntegrationCanonicalIdMappingItem(TypedDict):
    """Canonical entity kind, e.g. 'customer', 'person'."""
    entity: str
    externalIdField: str
    notes: NotRequired[str]


class IntegrationAuth(TypedDict):
    kind: NotRequired[Literal["api-key", "oauth", "service-account", "webhook-signature", "mtls"]]
    """Pointer into the secret manager. Never a literal secret."""
    secretRef: NotRequired[str]
    rotationPolicy: NotRequired[str]


class IntegrationEndpointsItem(TypedDict):
    name: str
    url: str
    method: NotRequired[str]


class IntegrationRateLimits(TypedDict):
    requestsPerMinute: NotRequired[int]
    burst: NotRequired[int]


class IntegrationObservability(TypedDict):
    dashboards: NotRequired[List[str]]
    alerts: NotRequired[List[str]]


class Integration(TypedDict):
    """Mapping between the coordination layer and an external system. No vendor names are canonical; integrations are pluggable."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["Integration"]
    """Local canonical name for the integration. The vendor name lives in 'system', not here."""
    name: str
    """Vendor / system identifier. Optional, the framework treats integrations as replaceable."""
    system: NotRequired[str]
    category: Literal["crm", "workflow-engine", "database", "project-management", "cloud", "orchestration", "ai-provider", "communication", "observability", "billing", "identity", "storage", "search", "analytics", "other"]
    status: Literal["planned", "configured", "active", "degraded", "deprecated", "removed"]
    """Module accountable for this integration."""
    ownerModule: str
    """Direction of state flow between this integration and the coordination layer."""
    mutationDirection: Literal["read-only", "write-only", "read-write", "writeback-only"]
    """Which canonical entities this integration maps to which external IDs."""
    canonicalIdMapping: NotRequired[List["IntegrationCanonicalIdMappingItem"]]
    auth: NotRequired["IntegrationAuth"]
    endpoints: NotRequired[List["IntegrationEndpointsItem"]]
    """Operations against this integration that require human-in-the-loop confirmation."""
    hitlRequiredFor: NotRequired[List[str]]
    rateLimits: NotRequired["IntegrationRateLimits"]
    observability: NotRequired["IntegrationObservability"]
