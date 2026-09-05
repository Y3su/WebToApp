import type { AppSpecV1 } from "@webtoapp/app-spec";

import { DEFAULT_POLICY_PACK } from "./default-pack.js";
import { isEffective, parsePolicyDate } from "./time.js";
import type {
  PolicyClassification,
  PolicyContext,
  PolicyEvaluation,
  PolicyPack,
  ResolvedPolicyContext,
} from "./types.js";

function classificationFor(
  findings: PolicyEvaluation["findings"],
): PolicyClassification {
  if (findings.some(({ classification }) => classification === "unsupported")) {
    return "unsupported";
  }
  return findings.length > 0 ? "changes_required" : "ready";
}

function resolveContext(
  spec: AppSpecV1,
  context: PolicyContext,
): ResolvedPolicyContext {
  const evaluatedAt = parsePolicyDate(
    context.evaluatedAt ?? new Date(),
    "evaluatedAt",
  );
  const verifiedDomains = new Set(
    (context.verifiedDomains ?? spec.ownership.verifiedDomains).map((domain) =>
      domain.toLowerCase(),
    ),
  );
  return {
    evaluatedAt,
    releaseIntent: context.releaseIntent ?? "store",
    verifiedDomains,
  };
}

export function evaluatePolicy(
  spec: AppSpecV1,
  context: PolicyContext = {},
  pack: PolicyPack = DEFAULT_POLICY_PACK,
): PolicyEvaluation {
  const resolved = resolveContext(spec, context);
  if (!isEffective(pack, resolved.evaluatedAt)) {
    throw new RangeError(
      `Policy pack ${pack.id}@${pack.version} is not effective at ${resolved.evaluatedAt.toISOString()}`,
    );
  }

  const effectiveRules = pack.rules.filter((rule) =>
    isEffective(rule, resolved.evaluatedAt),
  );
  const findings = effectiveRules.flatMap((rule) =>
    rule.evaluate(spec, resolved),
  );
  const appliedRuleVersions = Object.fromEntries(
    effectiveRules.map((rule) => [rule.id, rule.version]),
  );

  return Object.freeze({
    policyPackId: pack.id,
    policyPackVersion: pack.version,
    evaluatedAt: resolved.evaluatedAt.toISOString(),
    classification: classificationFor(findings),
    findings: Object.freeze(findings),
    appliedRuleVersions: Object.freeze(appliedRuleVersions),
  });
}
