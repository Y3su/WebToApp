import type { CapabilityToggle } from "@webtoapp/app-spec";

import type { PolicyFinding, PolicyRule } from "./types.js";

const EFFECTIVE_FROM = "2026-08-31T00:00:00.000Z";

function finding(
  ruleId: string,
  classification: PolicyFinding["classification"],
  path: string,
  message: string,
  remediation: string,
): PolicyFinding {
  return { ruleId, classification, path, message, remediation };
}

function safeHttpsUrl(value: unknown): URL | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" &&
      parsed.username === "" &&
      parsed.password === ""
      ? parsed
      : undefined;
  } catch {
    return undefined;
  }
}

function enabled(capability: CapabilityToggle): boolean {
  return capability.enabled;
}

export const httpsRule: PolicyRule = {
  id: "transport.https",
  version: "1.0.0",
  description:
    "Remote content and public metadata must use HTTPS without embedded credentials.",
  effectiveFrom: EFFECTIVE_FROM,
  evaluate(spec) {
    const findings: PolicyFinding[] = [];
    const candidates: Array<readonly [path: string, value: unknown]> = [
      ["/branding/iconUrl", spec.branding.iconUrl],
      ["/compliance/privacyPolicyUrl", spec.compliance.privacyPolicyUrl],
      ["/compliance/supportUrl", spec.compliance.supportUrl],
      ...spec.navigation.allowedOrigins.map(
        (value, index) =>
          [`/navigation/allowedOrigins/${index}`, value] as const,
      ),
      ...spec.navigation.oauthOrigins.map(
        (value, index) => [`/navigation/oauthOrigins/${index}`, value] as const,
      ),
    ];
    if (spec.source.kind === "url") {
      candidates.push(["/source/startUrl", spec.source.startUrl]);
    }
    if (spec.compliance.accountDeletionUrl !== undefined) {
      candidates.push([
        "/compliance/accountDeletionUrl",
        spec.compliance.accountDeletionUrl,
      ]);
    }
    if (spec.capabilities.push.tokenEndpoint !== undefined) {
      candidates.push([
        "/capabilities/push/tokenEndpoint",
        spec.capabilities.push.tokenEndpoint,
      ]);
    }

    for (const [path, value] of candidates) {
      if (safeHttpsUrl(value) === undefined) {
        findings.push(
          finding(
            this.id,
            "unsupported",
            path,
            "A remote URL is not safe HTTPS or contains embedded credentials.",
            "Use a public HTTPS URL with no username or password component.",
          ),
        );
      }
    }
    return findings;
  },
};

export const ownershipRule: PolicyRule = {
  id: "ownership.verified",
  version: "1.0.0",
  description:
    "Every app-controlled web origin must have current ownership verification.",
  effectiveFrom: EFFECTIVE_FROM,
  evaluate(spec, context) {
    const hosts = new Set<string>();
    if (spec.source.kind === "url") {
      const source = safeHttpsUrl(spec.source.startUrl);
      if (source !== undefined) hosts.add(source.hostname);
    }
    for (const origin of spec.navigation.allowedOrigins) {
      const parsed = safeHttpsUrl(origin);
      if (parsed !== undefined) hosts.add(parsed.hostname);
    }
    if (
      spec.capabilities.push.enabled &&
      spec.capabilities.push.tokenEndpoint !== undefined
    ) {
      const endpoint = safeHttpsUrl(spec.capabilities.push.tokenEndpoint);
      if (endpoint !== undefined) hosts.add(endpoint.hostname);
    }

    const unverified = [...hosts].filter(
      (host) => !context.verifiedDomains.has(host),
    );
    const findings = unverified.map((host) =>
      finding(
        this.id,
        "changes_required",
        "/ownership/verifiedDomains",
        `Ownership verification is missing or expired for ${host}.`,
        `Complete DNS TXT or well-known-file verification for ${host}, then create a new spec revision.`,
      ),
    );
    if (spec.ownership.verificationRecordIds.length === 0) {
      findings.push(
        finding(
          this.id,
          "changes_required",
          "/ownership/verificationRecordIds",
          "No ownership or content-rights verification record is attached.",
          "Attach a current verification record before requesting a release build.",
        ),
      );
    }
    return findings;
  },
};

export const allowedOriginsRule: PolicyRule = {
  id: "navigation.allowed-origins",
  version: "1.0.0",
  description: "Main-frame navigation is constrained to exact HTTPS origins.",
  effectiveFrom: EFFECTIVE_FROM,
  evaluate(spec) {
    const findings: PolicyFinding[] = [];
    spec.navigation.allowedOrigins.forEach((origin, index) => {
      const parsed = safeHttpsUrl(origin);
      if (
        origin.includes("*") ||
        parsed === undefined ||
        parsed.origin !== origin ||
        parsed.pathname !== "/" ||
        parsed.search !== "" ||
        parsed.hash !== ""
      ) {
        findings.push(
          finding(
            this.id,
            "unsupported",
            `/navigation/allowedOrigins/${index}`,
            "Allowed origins must be exact canonical HTTPS origins; wildcards and URL paths are forbidden.",
            "Replace the entry with an exact origin such as https://app.example.com.",
          ),
        );
      }
    });

    if (spec.source.kind === "url") {
      const source = safeHttpsUrl(spec.source.startUrl);
      if (
        source !== undefined &&
        !spec.navigation.allowedOrigins.includes(source.origin)
      ) {
        findings.push(
          finding(
            this.id,
            "changes_required",
            "/navigation/allowedOrigins",
            `The source origin ${source.origin} is not allowed for main-frame navigation.`,
            "Add the exact verified source origin to navigation.allowedOrigins.",
          ),
        );
      }
    }
    return findings;
  },
};

export const nativeValueRule: PolicyRule = {
  id: "store.native-value",
  version: "1.0.0",
  description:
    "Store submissions must provide meaningful configured native value.",
  effectiveFrom: EFFECTIVE_FROM,
  evaluate(spec, context) {
    if (context.releaseIntent !== "store") return [];

    const hasNativeNavigation =
      spec.navigation.native.mode !== "none" &&
      spec.navigation.native.items.length > 0;
    const hasNativeCapability = [
      spec.capabilities.push,
      spec.capabilities.share,
      spec.capabilities.files,
      spec.capabilities.camera,
      spec.capabilities.microphone,
      spec.capabilities.location,
      spec.capabilities.notifications,
    ].some(enabled);

    return hasNativeNavigation || hasNativeCapability
      ? []
      : [
          finding(
            this.id,
            "changes_required",
            "/capabilities",
            "The app is only a website wrapper and has no configured native value.",
            "Add useful native navigation or at least one justified native capability before store submission.",
          ),
        ];
  },
};

export const complianceUrlsRule: PolicyRule = {
  id: "compliance.public-urls",
  version: "1.0.0",
  description:
    "Release metadata includes accessible HTTPS privacy and support pages.",
  effectiveFrom: EFFECTIVE_FROM,
  evaluate(spec) {
    const findings: PolicyFinding[] = [];
    for (const [path, label, value] of [
      [
        "/compliance/privacyPolicyUrl",
        "privacy policy",
        spec.compliance.privacyPolicyUrl,
      ],
      ["/compliance/supportUrl", "support page", spec.compliance.supportUrl],
    ] as const) {
      if (safeHttpsUrl(value) === undefined) {
        findings.push(
          finding(
            this.id,
            "changes_required",
            path,
            `A valid public HTTPS ${label} URL is required.`,
            `Publish the ${label} and add its HTTPS URL to compliance metadata.`,
          ),
        );
      }
    }

    if (
      spec.compliance.dataPractices.includes("account") &&
      safeHttpsUrl(spec.compliance.accountDeletionUrl) === undefined
    ) {
      findings.push(
        finding(
          this.id,
          "changes_required",
          "/compliance/accountDeletionUrl",
          "Apps with account creation need a public account-deletion URL.",
          "Provide an HTTPS page where users can request or complete account deletion.",
        ),
      );
    }
    return findings;
  },
};

export const androidTargetApiRule: PolicyRule = {
  id: "android.target-api",
  version: "2026.1.0",
  description: "Google Play submissions target API level 36 or newer.",
  effectiveFrom: EFFECTIVE_FROM,
  evaluate(spec, context) {
    if (
      context.releaseIntent !== "store" ||
      spec.targets.android === undefined ||
      spec.targets.android.targetApi >= 36
    ) {
      return [];
    }
    return [
      finding(
        this.id,
        "changes_required",
        "/targets/android/targetApi",
        `Android target API ${spec.targets.android.targetApi} is below the effective store minimum of 36.`,
        "Set targets.android.targetApi to 36 or newer and rebuild the Android artifacts.",
      ),
    ];
  },
};

export const initialRules: readonly PolicyRule[] = Object.freeze([
  httpsRule,
  ownershipRule,
  allowedOriginsRule,
  nativeValueRule,
  complianceUrlsRule,
  androidTargetApiRule,
]);
