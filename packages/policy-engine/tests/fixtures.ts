import type { AppSpecV1 } from "@webtoapp/app-spec";

export function readySpec(): AppSpecV1 {
  return {
    schemaVersion: "1.0",
    identity: {
      displayName: "Acme Portal",
      slug: "acme-portal",
      version: "1.0.0",
      buildNumber: 1,
      platformIdentifiers: { android: "com.acme.portal" },
    },
    source: { kind: "url", startUrl: "https://app.acme.example/home" },
    ownership: {
      verifiedDomains: ["app.acme.example"],
      verificationRecordIds: ["verification_01"],
    },
    branding: {
      primaryColor: "#112233",
      backgroundColor: "#FFFFFF",
      iconUrl: "https://app.acme.example/icon.png",
    },
    navigation: {
      allowedOrigins: ["https://app.acme.example"],
      oauthOrigins: ["https://login.identity.example"],
      externalLinks: "system",
      native: {
        mode: "tabs",
        items: [
          { id: "home", label: "Home", url: "https://app.acme.example/home" },
        ],
      },
    },
    capabilities: {
      push: { enabled: false },
      share: { enabled: true, rationale: "Allow sharing portal links." },
      files: { enabled: false },
      camera: { enabled: false },
      microphone: { enabled: false },
      location: { enabled: false },
      notifications: { enabled: false },
    },
    targets: {
      android: { minSdk: 26, targetApi: 36, formats: ["aab"] },
    },
    compliance: {
      privacyPolicyUrl: "https://app.acme.example/privacy",
      supportUrl: "https://app.acme.example/support",
      accountDeletionUrl: "https://app.acme.example/delete-account",
      dataPractices: ["account"],
      ageRating: "4+",
    },
    release: { channel: "stable", updatePolicy: "store" },
  };
}
