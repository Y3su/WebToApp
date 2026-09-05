import type { AppSpecV1 } from "@webtoapp/app-spec";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_POLICY_PACK,
  evaluatePolicy,
  type PolicyContext,
} from "../src/index.js";
import { readySpec } from "./fixtures.js";

const at: PolicyContext = { evaluatedAt: "2026-09-05T00:00:00.000Z" };

describe("store-readiness evaluation", () => {
  it("classifies a compliant app as ready and records every applied rule version", () => {
    const result = evaluatePolicy(readySpec(), at);

    expect(result.classification).toBe("ready");
    expect(result.findings).toEqual([]);
    expect(Object.keys(result.appliedRuleVersions)).toHaveLength(
      DEFAULT_POLICY_PACK.rules.length,
    );
  });

  it("uses live domain-verification state when supplied", () => {
    const result = evaluatePolicy(readySpec(), { ...at, verifiedDomains: [] });

    expect(result.classification).toBe("changes_required");
    expect(result.findings).toContainEqual(
      expect.objectContaining({ ruleId: "ownership.verified" }),
    );
  });

  it("does not call a bare web wrapper store-ready", () => {
    const spec = readySpec();
    spec.navigation.native = { mode: "none", items: [] };
    spec.capabilities.share = { enabled: false };

    const result = evaluatePolicy(spec, at);
    expect(result.classification).toBe("changes_required");
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        ruleId: "store.native-value",
        path: "/capabilities",
      }),
    );
  });

  it("requires Android API 36 for store submissions", () => {
    const spec = readySpec();
    if (spec.targets.android !== undefined) spec.targets.android.targetApi = 35;

    const result = evaluatePolicy(spec, at);
    expect(result.classification).toBe("changes_required");
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        ruleId: "android.target-api",
        path: "/targets/android/targetApi",
      }),
    );
  });

  it("allows direct development artifacts to bypass store-only rules", () => {
    const spec = readySpec();
    spec.navigation.native = { mode: "none", items: [] };
    spec.capabilities.share = { enabled: false };
    if (spec.targets.android !== undefined) spec.targets.android.targetApi = 35;

    const result = evaluatePolicy(spec, {
      ...at,
      releaseIntent: "direct",
    });
    expect(result.classification).toBe("ready");
  });

  it("classifies cleartext transport as unsupported", () => {
    const spec = readySpec() as AppSpecV1 & {
      source: { kind: "url"; startUrl: string };
    };
    spec.source.startUrl = "http://app.acme.example/home";

    const result = evaluatePolicy(spec, at);
    expect(result.classification).toBe("unsupported");
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        ruleId: "transport.https",
        path: "/source/startUrl",
      }),
    );
  });

  it("rejects wildcard and path-based main-frame allowlist entries", () => {
    const spec = readySpec();
    spec.navigation.allowedOrigins = ["https://app.acme.example/*"];

    const result = evaluatePolicy(spec, at);
    expect(result.classification).toBe("unsupported");
    expect(result.findings).toContainEqual(
      expect.objectContaining({ ruleId: "navigation.allowed-origins" }),
    );
  });

  it("requires privacy, support, and account-deletion URLs", () => {
    const spec = readySpec();
    const unsafeCompliance = spec.compliance as typeof spec.compliance & {
      privacyPolicyUrl: string;
      accountDeletionUrl?: string;
    };
    unsafeCompliance.privacyPolicyUrl = "not-a-url";
    delete unsafeCompliance.accountDeletionUrl;

    const result = evaluatePolicy(spec, at);
    expect(
      result.findings.filter(
        ({ ruleId }) => ruleId === "compliance.public-urls",
      ),
    ).toHaveLength(2);
  });
});
