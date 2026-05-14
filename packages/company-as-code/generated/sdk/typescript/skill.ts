// Generated from /schemas/skill.schema.json — do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

/** Tier-3 knowledge primitive: composable, reusable expertise referenced by name. One canonical YAML source; adapter generators emit per-runtime variants (Claude SKILL.md, provider-neutral AGENTS.md, Gemini Gem JSON). */
export interface Skill {
  apiVersion: "company-as-code/v1";
  kind: "Skill";
  /** Kebab-case skill identifier. Unique across the company. */
  name: string;
  /** One-sentence 'when to use this skill'. Matches Claude SKILL.md frontmatter shape. */
  description: string;
  /** Markdown instructions read by the agent at invocation. Tier-2 in shape (numbered steps, inputs, outputs, definition of done). */
  body: string;
  /** Semantic version of the skill. Bump when the technique changes, not when an instance does. */
  version?: string;
  owner?: {
    module?: string;
    person?: string;
  };
  /** Plain-language conditions under which an agent or operator should invoke this skill. */
  triggers?: Array<string>;
  inputs?: Array<{
    name: string;
    type?: string;
    description?: string;
    required?: boolean;
  }>;
  outputs?: Array<{
    name: string;
    type?: string;
    description?: string;
  }>;
  /** Named runtime tools / capabilities the skill exercises. */
  tools?: Array<string>;
  /** Default autonomy for an agent invoking this skill. Agents may narrow further; never widen. */
  autonomy?: "autonomous" | "human-gated" | "escalated";
  relatedSkills?: Array<string>;
  tags?: Array<string>;
  examples?: Array<{
    title: string;
    input?: string;
    output?: string;
  }>;
}
