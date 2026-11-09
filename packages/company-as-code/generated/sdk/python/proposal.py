# Generated from /schemas/proposal.schema.json, do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class ProposalAuthor(TypedDict):
    """Who wrote the proposal. Agents may author freely; authorship carries no authority."""
    kind: Literal["person", "team", "agent"]
    id: str


class ProposalTargetsItem(TypedDict):
    """Repo-relative path of the conserved file."""
    path: str
    surface: Literal["spec", "standard", "schema", "policy", "autonomy-policy", "escalation-policy", "adr", "manifest", "control", "requirement", "ci", "governance"]
    """One line on what changes in this file."""
    change: NotRequired[str]


class ProposalRulingActor(TypedDict):
    """Rulings are made by humans. An agent may draft the wording; it may not be the actor."""
    kind: Literal["person"]
    id: str


class ProposalRuling(TypedDict):
    """The recorded exercise of authority. Required for every terminal status. A ruling claimed anywhere other than here is not a ruling."""
    decision: Literal["accepted", "rejected"]
    """Rulings are made by humans. An agent may draft the wording; it may not be the actor."""
    actor: "ProposalRulingActor"
    date: str
    """The decider's own words, quoted, not paraphrased."""
    verbatim: str
    conditions: NotRequired[List[str]]


class Proposal(TypedDict):
    """The mutation queue for the conserved core. Changing the spec, a standard, an authority grant, a schema, or an autonomy policy is not an ordinary edit: it goes through a Proposal that states the reason, the evidence, the expected benefit, how the change will be validated, and how it is rolled back. A Proposal reaching a terminal status carries a Ruling with the decider's canonical ID and their words verbatim."""
    apiVersion: Literal["company-as-code/v1alpha1"]
    kind: Literal["Proposal"]
    """Canonical, permanent proposal ID. Numbers are never reused, including for withdrawn proposals."""
    id: str
    title: str
    """'accepted' means ruled on but not yet landed. 'applied' means the conserved files now reflect it."""
    status: Literal["draft", "open", "accepted", "rejected", "applied", "withdrawn", "superseded"]
    """Who wrote the proposal. Agents may author freely; authorship carries no authority."""
    author: "ProposalAuthor"
    opened: NotRequired[str]
    """The conserved surfaces this proposal mutates. Anything not listed here is out of scope for the ruling."""
    targets: List["ProposalTargetsItem"]
    """The friction that forced this proposal. Not the solution."""
    reason: str
    """What makes the reason a fact rather than an opinion: incident IDs, audit references, failing runs, dated observations."""
    evidence: NotRequired[List[str]]
    benefit: str
    """How anyone will know afterwards whether the change worked. A proposal with no falsifiable validation is a preference."""
    validation: str
    """How the change is undone, and what is lost by undoing it."""
    rollback: str
    """The recorded exercise of authority. Required for every terminal status. A ruling claimed anywhere other than here is not a ruling."""
    ruling: NotRequired["ProposalRuling"]
    """Repo-relative path of the ADR recording the change, when the change is architectural."""
    adr: NotRequired[str]
    """Earlier proposals this one replaces."""
    supersedes: NotRequired[List[str]]
    """The proposal that replaced this one. Required when status is 'superseded'."""
    supersededBy: NotRequired[str]
    appliedOn: NotRequired[str]
    tags: NotRequired[List[str]]
