import { describe, expect, it } from "vitest";

import {
  evaluatePolicy,
  selectEffectivePolicyPack,
  type PolicyPack,
  type PolicyRule,
} from "../src/index.js";
import { readySpec } from "./fixtures.js";

const noOpRule: PolicyRule = {
  id: "test.no-op",
  version: "1.0.0",
  description: "Test rule",
  effectiveFrom: "2026-01-01T00:00:00.000Z",
  evaluate: () => [],
};

function pack(
  version: string,
  effectiveFrom: string,
  effectiveUntil?: string,
): PolicyPack {
  return {
    id: "test.pack",
    version,
    effectiveFrom,
    ...(effectiveUntil === undefined ? {} : { effectiveUntil }),
    rules: [noOpRule],
  };
}

describe("effective-dated policy packs", () => {
  it("selects the newest pack effective at the evaluation instant", () => {
    const oldPack = pack(
      "1.0.0",
      "2026-01-01T00:00:00.000Z",
      "2026-07-01T00:00:00.000Z",
    );
    const newPack = pack("2.0.0", "2026-07-01T00:00:00.000Z");

    expect(
      selectEffectivePolicyPack([newPack, oldPack], "2026-06-30T23:59:59.999Z")
        .version,
    ).toBe("1.0.0");
    expect(
      selectEffectivePolicyPack([oldPack, newPack], "2026-07-01T00:00:00.000Z")
        .version,
    ).toBe("2.0.0");
  });

  it("does not apply a rule before its own effective date", () => {
    const futureRule: PolicyRule = {
      ...noOpRule,
      id: "test.future",
      effectiveFrom: "2027-01-01T00:00:00.000Z",
    };
    const candidate = {
      ...pack("1.0.0", "2026-01-01T00:00:00.000Z"),
      rules: [noOpRule, futureRule],
    };

    const result = evaluatePolicy(
      readySpec(),
      { evaluatedAt: "2026-06-01T00:00:00.000Z" },
      candidate,
    );
    expect(result.appliedRuleVersions).toEqual({ "test.no-op": "1.0.0" });
  });

  it("fails closed when no supplied pack is effective", () => {
    expect(() =>
      selectEffectivePolicyPack(
        [pack("2.0.0", "2027-01-01T00:00:00.000Z")],
        "2026-01-01T00:00:00.000Z",
      ),
    ).toThrow(/No policy pack/);
  });

  it("rejects inverted effective-date windows", () => {
    expect(() =>
      selectEffectivePolicyPack(
        [
          pack(
            "broken",
            "2026-07-01T00:00:00.000Z",
            "2026-01-01T00:00:00.000Z",
          ),
        ],
        "2026-03-01T00:00:00.000Z",
      ),
    ).toThrow(/effectiveUntil/);
  });
});
