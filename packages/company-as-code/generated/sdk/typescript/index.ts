// Generated SDK barrel, do not edit by hand.
// Regenerate with `npm --prefix cli run generate`.

export type { Agent } from "./agent.js";
export type { AuditRecord } from "./audit-record.js";
export type { Automation } from "./automation.js";
export type { AutonomyPolicy } from "./autonomy-policy.js";
export type { Capability } from "./capability.js";
export type { Control } from "./control.js";
export type { Dashboard } from "./dashboard.js";
export type { EscalationPolicy } from "./escalation-policy.js";
export type { EventTypeRegistry } from "./event-type-registry.js";
export type { Event } from "./event.js";
export type { Goal } from "./goal.js";
export type { HubModule } from "./hub-module.js";
export type { Initiative } from "./initiative.js";
export type { Instance } from "./instance.js";
export type { Integration } from "./integration.js";
export type { Interface } from "./interface.js";
export type { ModuleManifest } from "./manifest.js";
export type { Metric } from "./metric.js";
export type { Organization } from "./organization.js";
export type { Person } from "./person.js";
export type { Proposal } from "./proposal.js";
export type { Requirement } from "./requirement.js";
export type { ShadowEnrollment } from "./shadow-enrollment.js";
export type { Skill } from "./skill.js";
export type { StateSnapshot } from "./state-snapshot.js";
export type { Task } from "./task.js";
export type { Workflow } from "./workflow.js";

import type { Agent as _Agent } from "./agent.js";
import type { AuditRecord as _AuditRecord } from "./audit-record.js";
import type { Automation as _Automation } from "./automation.js";
import type { AutonomyPolicy as _AutonomyPolicy } from "./autonomy-policy.js";
import type { Capability as _Capability } from "./capability.js";
import type { Control as _Control } from "./control.js";
import type { Dashboard as _Dashboard } from "./dashboard.js";
import type { EscalationPolicy as _EscalationPolicy } from "./escalation-policy.js";
import type { EventTypeRegistry as _EventTypeRegistry } from "./event-type-registry.js";
import type { Event as _Event } from "./event.js";
import type { Goal as _Goal } from "./goal.js";
import type { HubModule as _HubModule } from "./hub-module.js";
import type { Initiative as _Initiative } from "./initiative.js";
import type { Instance as _Instance } from "./instance.js";
import type { Integration as _Integration } from "./integration.js";
import type { Interface as _Interface } from "./interface.js";
import type { ModuleManifest as _ModuleManifest } from "./manifest.js";
import type { Metric as _Metric } from "./metric.js";
import type { Organization as _Organization } from "./organization.js";
import type { Person as _Person } from "./person.js";
import type { Proposal as _Proposal } from "./proposal.js";
import type { Requirement as _Requirement } from "./requirement.js";
import type { ShadowEnrollment as _ShadowEnrollment } from "./shadow-enrollment.js";
import type { Skill as _Skill } from "./skill.js";
import type { StateSnapshot as _StateSnapshot } from "./state-snapshot.js";
import type { Task as _Task } from "./task.js";
import type { Workflow as _Workflow } from "./workflow.js";

/** Discriminated union of every canonical CaC document, keyed by `kind`. */
export type CompanyDocument =
  | _Agent
  | _AuditRecord
  | _Automation
  | _AutonomyPolicy
  | _Capability
  | _Control
  | _Dashboard
  | _EscalationPolicy
  | _EventTypeRegistry
  | _Event
  | _Goal
  | _HubModule
  | _Initiative
  | _Instance
  | _Integration
  | _Interface
  | _ModuleManifest
  | _Metric
  | _Organization
  | _Person
  | _Proposal
  | _Requirement
  | _ShadowEnrollment
  | _Skill
  | _StateSnapshot
  | _Task
  | _Workflow;
