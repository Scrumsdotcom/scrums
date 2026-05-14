# Generated from /schemas/skill.schema.json — do not edit by hand.
# Regenerate with `npm --prefix cli run generate`.
# Requires Python 3.11+ (uses typing.NotRequired).
from __future__ import annotations

from typing import Any, Dict, List, Literal, NotRequired, TypedDict, Union

class SkillOwner(TypedDict, total=False):
    module: NotRequired[str]
    person: NotRequired[str]


class SkillInputsItem(TypedDict, total=False):
    name: str
    type: NotRequired[str]
    description: NotRequired[str]
    required: NotRequired[bool]


class SkillOutputsItem(TypedDict, total=False):
    name: str
    type: NotRequired[str]
    description: NotRequired[str]


class SkillExamplesItem(TypedDict, total=False):
    title: str
    input: NotRequired[str]
    output: NotRequired[str]


class Skill(TypedDict, total=False):
    """Tier-3 knowledge primitive: composable, reusable expertise referenced by name. One canonical YAML source; adapter generators emit per-runtime variants (Claude SKILL.md, provider-neutral AGENTS.md, Gemini Gem JSON)."""
    apiVersion: Literal["company-as-code/v1"]
    kind: Literal["Skill"]
    """Kebab-case skill identifier. Unique across the company."""
    name: str
    """One-sentence 'when to use this skill'. Matches Claude SKILL.md frontmatter shape."""
    description: str
    """Markdown instructions read by the agent at invocation. Tier-2 in shape (numbered steps, inputs, outputs, definition of done)."""
    body: str
    """Semantic version of the skill. Bump when the technique changes, not when an instance does."""
    version: NotRequired[str]
    owner: NotRequired["SkillOwner"]
    """Plain-language conditions under which an agent or operator should invoke this skill."""
    triggers: NotRequired[List[str]]
    inputs: NotRequired[List["SkillInputsItem"]]
    outputs: NotRequired[List["SkillOutputsItem"]]
    """Named runtime tools / capabilities the skill exercises."""
    tools: NotRequired[List[str]]
    """Default autonomy for an agent invoking this skill. Agents may narrow further; never widen."""
    autonomy: NotRequired[Literal["autonomous", "human-gated", "escalated"]]
    relatedSkills: NotRequired[List[str]]
    tags: NotRequired[List[str]]
    examples: NotRequired[List["SkillExamplesItem"]]
