import type { AppSpecV1 } from "../src/index.js";

export function validSpec(): AppSpecV1 {
  return {
    schemaVersion: "1.0",
    identity: {
      displayName: "Acme Workspace",
      slug: "acme-workspace",
      version: "1.2.3",
      buildNumber: 42,
      platformIdentifiers: {
        android: "com.acme.workspace",
        windows: "Acme.Workspace",
      },
    },
    source: {
      kind: "url",
      startUrl: "https://app.acme.example/workspace?from=app",
    },
    ownership: {
      verifiedDomains: ["app.acme.example"],
      verificationRecordIds: ["verification_01"],
    },
    branding: {
      primaryColor: "#112233",
      backgroundColor: "#FFFFFF",
      iconUrl: "https://app.acme.example/assets/icon.png",
    },
    navigation: {
      allowedOrigins: ["https://app.acme.example"],
      oauthOrigins: ["https://accounts.example-idp.test"],
      externalLinks: "system",
      native: {
        mode: "tabs",
        items: [
          {
            id: "home",
            label: "Home",
            url: "https://app.acme.example/workspace",
          },
        ],
      },
    },
    capabilities: {
      push: { enabled: false },
      share: {
        enabled: true,
        rationale: "Allow users to share workspace links.",
      },
      files: { enabled: false },
      camera: { enabled: false },
      microphone: { enabled: false },
      location: { enabled: false },
      notifications: { enabled: false },
    },
    targets: {
      android: { minSdk: 26, targetApi: 36, formats: ["apk", "aab"] },
      windows: {
        minVersion: "10.0.17763",
        architectures: ["x64"],
        formats: ["msix"],
      },
    },
    compliance: {
      privacyPolicyUrl: "https://app.acme.example/privacy",
      supportUrl: "https://app.acme.example/support",
      dataPractices: ["account", "usage"],
      ageRating: "4+",
      accountDeletionUrl: "https://app.acme.example/account/delete",
    },
    release: { channel: "stable", updatePolicy: "store" },
  };
}
