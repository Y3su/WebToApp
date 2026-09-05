import { describe, expect, it } from "vitest";

import {
  canonicalizeAppSpec,
  canonicalizeJson,
  digestAppSpec,
  freezeAppSpecRevision,
} from "../src/index.js";
import { validSpec } from "./fixtures.js";

describe("canonical AppSpec revisions", () => {
  it("sorts object properties recursively without reordering arrays", () => {
    expect(canonicalizeJson({ z: [3, 2, 1], a: { y: true, x: null } })).toBe(
      '{"a":{"x":null,"y":true},"z":[3,2,1]}',
    );
  });

  it("gives semantically identical key orderings the same digest", () => {
    const original = validSpec();
    const reordered = JSON.parse(JSON.stringify(original)) as Record<
      string,
      unknown
    >;
    reordered.release = { updatePolicy: "store", channel: "stable" };
    reordered.identity = {
      platformIdentifiers: {
        windows: "Acme.Workspace",
        android: "com.acme.workspace",
      },
      buildNumber: 42,
      version: "1.2.3",
      slug: "acme-workspace",
      displayName: "Acme Workspace",
    };

    expect(digestAppSpec(reordered)).toBe(digestAppSpec(original));
    expect(digestAppSpec(original)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes the digest when build input changes", () => {
    const original = validSpec();
    const changed = validSpec();
    changed.identity.buildNumber += 1;

    expect(digestAppSpec(changed)).not.toBe(digestAppSpec(original));
  });

  it("returns the canonical bytes and digest together", () => {
    const revision = freezeAppSpecRevision(validSpec());
    expect(revision.canonicalJson).toBe(canonicalizeAppSpec(revision.spec));
    expect(revision.sha256).toBe(digestAppSpec(revision.spec));
    expect(Object.isFrozen(revision)).toBe(true);
    expect(Object.isFrozen(revision.spec.identity)).toBe(true);
    expect(() => {
      revision.spec.identity.buildNumber = 999;
    }).toThrow();
  });

  it("rejects cyclic, non-finite, and non-JSON input", () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(() => canonicalizeJson(cyclic)).toThrow(/cyclic/);
    expect(() => canonicalizeJson(Number.NaN)).toThrow(/finite/);
    expect(() => canonicalizeJson(undefined)).toThrow(/non-JSON/);
    expect(() => canonicalizeJson({ nested: undefined })).toThrow(/non-JSON/);
    expect(() => canonicalizeJson("\uD800")).toThrow(/surrogate/);
  });
});
