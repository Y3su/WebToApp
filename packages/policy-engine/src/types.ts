import type { AppSpecV1 } from "@webtoapp/app-spec";

export type PolicyClassification = "ready" | "changes_required" | "unsupported";
export type FindingClassification = Exclude<PolicyClassification, "ready">;
export type ReleaseIntent = "development" | "direct" | "store";

export interface PolicyContext {
  /** Defaults to the current time. Accepts only a valid Date or ISO-8601 timestamp. */
  evaluatedAt?: Date | string;
  /** Store readiness is the conservative default. */
  releaseIntent?: ReleaseIntent;
  /** Live ownership state. Defaults to the domains recorded in the immutable spec. */
  verifiedDomains?: readonly string[];
}

export interface ResolvedPolicyContext {
  evaluatedAt: Date;
  releaseIntent: ReleaseIntent;
  verifiedDomains: ReadonlySet<string>;
}

export interface PolicyFinding {
  ruleId: string;
  classification: FindingClassification;
  path: string;
  message: string;
  remediation: string;
}

export interface PolicyRule {
  id: string;
  version: string;
  description: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  evaluate(
    spec: AppSpecV1,
    context: ResolvedPolicyContext,
  ): readonly PolicyFinding[];
}

export interface PolicyPack {
  id: string;
  version: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  rules: readonly PolicyRule[];
}

export interface PolicyEvaluation {
  policyPackId: string;
  policyPackVersion: string;
  evaluatedAt: string;
  classification: PolicyClassification;
  findings: readonly PolicyFinding[];
  appliedRuleVersions: Readonly<Record<string, string>>;
}
