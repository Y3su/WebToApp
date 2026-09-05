import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  AppSpecValidationError,
  parseAppSpec,
  validateAppSpec,
} from "../src/index.js";
import { validSpec } from "./fixtures.js";

describe("AppSpecV1 validation", () => {
  it.each(["url-app.json", "static-app.json"])(
    "accepts the %s example",
    async (name) => {
      const contents = await readFile(
        new URL(`../examples/${name}`, import.meta.url),
        "utf8",
      );
      expect(validateAppSpec(JSON.parse(contents))).toEqual(
        expect.objectContaining({ success: true }),
      );
    },
  );

  it("rejects unknown properties so secrets cannot be smuggled into a build spec", () => {
    const candidate = validSpec() as AppSpecV1WithSecret;
    candidate.signingPrivateKey = "do-not-accept-secret-material";

    const result = validateAppSpec(candidate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "schema.additionalProperties" }),
      );
    }
  });

  it("rejects credentials embedded in URLs", () => {
    const candidate = validSpec();
    candidate.source = {
      kind: "url",
      startUrl: "https://operator:secret@app.acme.example/workspace",
    };

    expect(validateAppSpec(candidate)).toEqual({
      success: false,
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: "semantic.unsafeUrl",
          path: "/source/startUrl",
        }),
      ]),
    });
  });

  it("rejects origins with paths and non-canonical spelling", () => {
    const candidate = validSpec();
    candidate.navigation.allowedOrigins = ["https://APP.acme.example/path"];

    const result = validateAppSpec(candidate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.issues.some(({ path }) =>
          path.startsWith("/navigation/allowedOrigins"),
        ),
      ).toBe(true);
    }
  });

  it("requires the URL source origin in the exact navigation allowlist", () => {
    const candidate = validSpec();
    candidate.navigation.allowedOrigins = [];

    const result = validateAppSpec(candidate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "semantic.missingSourceOrigin" }),
      );
    }
  });

  it("requires every main-frame origin to use a verified domain", () => {
    const candidate = validSpec();
    candidate.navigation.allowedOrigins.push("https://unowned.example");

    const result = validateAppSpec(candidate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "semantic.unverifiedOrigin" }),
      );
    }
  });

  it("requires a meaningful rationale for enabled native capabilities", () => {
    const candidate = validSpec() as unknown as Record<string, unknown>;
    const capabilities = candidate.capabilities as Record<string, unknown>;
    capabilities.camera = { enabled: true, rationale: "camera" };

    const result = validateAppSpec(candidate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "schema.minLength" }),
      );
    }
  });

  it("keeps targets and platform identifiers in one-to-one alignment", () => {
    const candidate = validSpec();
    delete candidate.identity.platformIdentifiers.android;

    const result = validateAppSpec(candidate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "semantic.missingPlatformIdentifier" }),
      );
    }
  });

  it("rejects duplicate native navigation IDs even when the items differ", () => {
    const candidate = validSpec();
    candidate.navigation.native.items.push({
      id: "home",
      label: "Alternate home",
      url: "https://app.acme.example/alternate",
    });

    const result = validateAppSpec(candidate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: "semantic.duplicateNavigationId" }),
      );
    }
  });

  it("throws a structured error from parseAppSpec", () => {
    expect(() => parseAppSpec({ schemaVersion: "1.0" })).toThrow(
      AppSpecValidationError,
    );
  });
});

interface AppSpecV1WithSecret extends ReturnType<typeof validSpec> {
  signingPrivateKey?: string;
}
