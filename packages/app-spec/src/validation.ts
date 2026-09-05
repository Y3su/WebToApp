import { createRequire } from "node:module";
import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js";
import type { FormatsPlugin } from "ajv-formats";

const addFormats = createRequire(import.meta.url)(
  "ajv-formats",
) as FormatsPlugin;

import { appSpecV1Schema } from "./schema.js";
import type { AppSpecV1, Platform } from "./types.js";

export interface AppSpecValidationIssue {
  path: string;
  code: string;
  message: string;
}

export type AppSpecValidationResult =
  | { success: true; value: AppSpecV1 }
  | { success: false; issues: AppSpecValidationIssue[] };

export class AppSpecValidationError extends Error {
  readonly issues: readonly AppSpecValidationIssue[];

  constructor(issues: readonly AppSpecValidationIssue[]) {
    super(
      `Invalid AppSpecV1: ${issues.map((issue) => `${issue.path} ${issue.message}`).join("; ")}`,
    );
    this.name = "AppSpecValidationError";
    this.issues = issues;
  }
}

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictTypes: false,
  // Conditional branches require properties declared in the enclosing schema.
  strictRequired: false,
  validateFormats: true,
});
addFormats(ajv);

const validateSchema = ajv.compile<AppSpecV1>(appSpecV1Schema);

function fromAjvError(error: ErrorObject): AppSpecValidationIssue {
  const missingProperty =
    error.keyword === "required" &&
    typeof error.params.missingProperty === "string"
      ? `/${escapeJsonPointer(error.params.missingProperty)}`
      : "";

  return {
    path: `${error.instancePath}${missingProperty}` || "/",
    code: `schema.${error.keyword}`,
    message: error.message ?? "failed schema validation",
  };
}

function escapeJsonPointer(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function issue(
  path: string,
  code: string,
  message: string,
): AppSpecValidationIssue {
  return { path, code, message };
}

function parseHttpsUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username !== "" ||
      url.password !== ""
    ) {
      return undefined;
    }
    return url;
  } catch {
    return undefined;
  }
}

function semanticIssues(spec: AppSpecV1): AppSpecValidationIssue[] {
  const issues: AppSpecValidationIssue[] = [];
  const allowedOrigins = new Set(spec.navigation.allowedOrigins);
  const verifiedDomains = new Set(spec.ownership.verifiedDomains);

  for (const [collectionName, origins] of [
    ["allowedOrigins", spec.navigation.allowedOrigins],
    ["oauthOrigins", spec.navigation.oauthOrigins],
  ] as const) {
    origins.forEach((origin, index) => {
      const parsed = parseHttpsUrl(origin);
      const path = `/navigation/${collectionName}/${index}`;
      if (parsed === undefined || parsed.origin !== origin) {
        issues.push(
          issue(
            path,
            "semantic.nonCanonicalOrigin",
            "must be an exact canonical HTTPS origin without credentials, a path, query, or fragment",
          ),
        );
        return;
      }

      if (
        collectionName === "allowedOrigins" &&
        !verifiedDomains.has(parsed.hostname)
      ) {
        issues.push(
          issue(
            path,
            "semantic.unverifiedOrigin",
            `hostname ${parsed.hostname} is not listed in ownership.verifiedDomains`,
          ),
        );
      }
    });
  }

  if (spec.source.kind === "url") {
    const sourceUrl = parseHttpsUrl(spec.source.startUrl);
    if (sourceUrl === undefined) {
      issues.push(
        issue(
          "/source/startUrl",
          "semantic.unsafeUrl",
          "must be an HTTPS URL without embedded credentials",
        ),
      );
    } else {
      if (!allowedOrigins.has(sourceUrl.origin)) {
        issues.push(
          issue(
            "/navigation/allowedOrigins",
            "semantic.missingSourceOrigin",
            `must contain the source origin ${sourceUrl.origin}`,
          ),
        );
      }
      if (!verifiedDomains.has(sourceUrl.hostname)) {
        issues.push(
          issue(
            "/ownership/verifiedDomains",
            "semantic.unverifiedSource",
            `must contain the source hostname ${sourceUrl.hostname}`,
          ),
        );
      }
    }
  }

  const safeUrlFields: ReadonlyArray<readonly [string, string]> = [
    ["/branding/iconUrl", spec.branding.iconUrl],
    ["/compliance/privacyPolicyUrl", spec.compliance.privacyPolicyUrl],
    ["/compliance/supportUrl", spec.compliance.supportUrl],
  ];
  const optionalSafeUrlFields: ReadonlyArray<
    readonly [string, string | undefined]
  > = [
    ["/branding/splash/imageUrl", spec.branding.splash?.imageUrl],
    ["/capabilities/push/tokenEndpoint", spec.capabilities.push.tokenEndpoint],
    ["/compliance/accountDeletionUrl", spec.compliance.accountDeletionUrl],
  ];

  for (const [path, value] of [...safeUrlFields, ...optionalSafeUrlFields]) {
    if (value !== undefined && parseHttpsUrl(value) === undefined) {
      issues.push(
        issue(
          path,
          "semantic.unsafeUrl",
          "must be an HTTPS URL without embedded credentials",
        ),
      );
    }
  }

  if (
    spec.capabilities.push.enabled &&
    spec.capabilities.push.tokenEndpoint !== undefined
  ) {
    const endpoint = parseHttpsUrl(spec.capabilities.push.tokenEndpoint);
    if (endpoint !== undefined && !verifiedDomains.has(endpoint.hostname)) {
      issues.push(
        issue(
          "/capabilities/push/tokenEndpoint",
          "semantic.unverifiedPushEndpoint",
          "push token endpoint must use a verified domain",
        ),
      );
    }
  }

  const navigationIds = new Set<string>();
  spec.navigation.native.items.forEach((item, index) => {
    if (navigationIds.has(item.id)) {
      issues.push(
        issue(
          `/navigation/native/items/${index}/id`,
          "semantic.duplicateNavigationId",
          `navigation item id ${item.id} is duplicated`,
        ),
      );
    }
    navigationIds.add(item.id);

    const itemUrl = parseHttpsUrl(item.url);
    if (itemUrl === undefined || !allowedOrigins.has(itemUrl.origin)) {
      issues.push(
        issue(
          `/navigation/native/items/${index}/url`,
          "semantic.navigationOutsideAllowedOrigins",
          "native navigation URLs must use an allowed origin",
        ),
      );
    }
  });

  const platforms = Object.keys(spec.targets) as Platform[];
  const identifiers = spec.identity.platformIdentifiers;
  for (const platform of platforms) {
    if (identifiers[platform] === undefined) {
      issues.push(
        issue(
          `/identity/platformIdentifiers/${platform}`,
          "semantic.missingPlatformIdentifier",
          `an identifier is required because the ${platform} target is enabled`,
        ),
      );
    }
  }
  for (const platform of Object.keys(identifiers) as Platform[]) {
    if (spec.targets[platform] === undefined) {
      issues.push(
        issue(
          `/identity/platformIdentifiers/${platform}`,
          "semantic.orphanPlatformIdentifier",
          `remove the identifier or enable the ${platform} target`,
        ),
      );
    }
  }

  if (
    spec.targets.android !== undefined &&
    spec.targets.android.minSdk > spec.targets.android.targetApi
  ) {
    issues.push(
      issue(
        "/targets/android/minSdk",
        "semantic.androidSdkOrder",
        "minSdk cannot be greater than targetApi",
      ),
    );
  }

  if (
    spec.targets.macos?.architectures.includes("universal") === true &&
    spec.targets.macos.architectures.length > 1
  ) {
    issues.push(
      issue(
        "/targets/macos/architectures",
        "semantic.ambiguousUniversalArchitecture",
        "universal already includes x64 and arm64 and must be the only architecture entry",
      ),
    );
  }

  return issues;
}

export function validateAppSpec(input: unknown): AppSpecValidationResult {
  if (!validateSchema(input)) {
    return {
      success: false,
      issues: (validateSchema.errors ?? []).map(fromAjvError),
    };
  }

  const issues = semanticIssues(input);
  return issues.length === 0
    ? { success: true, value: input }
    : { success: false, issues };
}

export function parseAppSpec(input: unknown): AppSpecV1 {
  const result = validateAppSpec(input);
  if (!result.success) {
    throw new AppSpecValidationError(result.issues);
  }
  return result.value;
}

export function isAppSpecV1(input: unknown): input is AppSpecV1 {
  return validateAppSpec(input).success;
}
