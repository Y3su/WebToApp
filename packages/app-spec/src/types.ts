export const APP_SPEC_SCHEMA_VERSION = "1.0" as const;

export type Platform = "android" | "ios" | "windows" | "macos" | "linux";

export interface PlatformIdentifiers {
  android?: string;
  ios?: string;
  windows?: string;
  macos?: string;
  linux?: string;
}

export interface AppIdentity {
  displayName: string;
  slug: string;
  version: string;
  buildNumber: number;
  platformIdentifiers: PlatformIdentifiers;
}

export interface UrlSource {
  kind: "url";
  startUrl: string;
}

export interface StaticSource {
  kind: "static";
  artifactSha256: string;
}

export type AppSource = UrlSource | StaticSource;

export interface Ownership {
  verifiedDomains: string[];
  verificationRecordIds: string[];
}

export interface SplashBranding {
  backgroundColor: string;
  imageUrl?: string;
}

export interface Branding {
  primaryColor: string;
  backgroundColor: string;
  iconUrl: string;
  splash?: SplashBranding;
}

export interface NativeNavigationItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
}

export interface NativeNavigation {
  mode: "none" | "tabs" | "sidebar";
  items: NativeNavigationItem[];
}

export interface Navigation {
  allowedOrigins: string[];
  oauthOrigins: string[];
  externalLinks: "system" | "block";
  native: NativeNavigation;
}

export interface CapabilityToggle {
  enabled: boolean;
  rationale?: string;
}

export interface PushCapability extends CapabilityToggle {
  tokenEndpoint?: string;
}

export interface FileCapability extends CapabilityToggle {
  downloads?: boolean;
  uploads?: boolean;
}

export interface Capabilities {
  push: PushCapability;
  share: CapabilityToggle;
  files: FileCapability;
  camera: CapabilityToggle;
  microphone: CapabilityToggle;
  location: CapabilityToggle;
  notifications: CapabilityToggle;
}

export interface AndroidTarget {
  minSdk: number;
  targetApi: number;
  formats: Array<"apk" | "aab">;
  signingReferenceId?: string;
}

export interface IosTarget {
  minVersion: string;
  formats: Array<"xcode" | "archive" | "ipa">;
  signingReferenceId?: string;
}

export interface WindowsTarget {
  minVersion: string;
  architectures: Array<"x64" | "arm64">;
  formats: Array<"msix" | "nsis">;
  signingReferenceId?: string;
}

export interface MacosTarget {
  minVersion: string;
  architectures: Array<"x64" | "arm64" | "universal">;
  formats: Array<"app" | "dmg">;
  signingReferenceId?: string;
}

export interface LinuxTarget {
  architectures: Array<"x64" | "arm64">;
  formats: Array<"appimage" | "deb">;
  signingReferenceId?: string;
}

export interface Targets {
  android?: AndroidTarget;
  ios?: IosTarget;
  windows?: WindowsTarget;
  macos?: MacosTarget;
  linux?: LinuxTarget;
}

export type DataPractice =
  | "account"
  | "contact"
  | "financial"
  | "health"
  | "location"
  | "identifiers"
  | "usage"
  | "diagnostics"
  | "user-content";

export interface Compliance {
  privacyPolicyUrl: string;
  supportUrl: string;
  accountDeletionUrl?: string;
  dataPractices: DataPractice[];
  ageRating: "4+" | "9+" | "12+" | "17+";
  reviewerNotes?: string;
}

export interface ReleaseConfiguration {
  channel: "internal" | "beta" | "stable";
  updatePolicy: "store" | "signed-feed" | "manual";
}

export interface AppSpecV1 {
  schemaVersion: typeof APP_SPEC_SCHEMA_VERSION;
  identity: AppIdentity;
  source: AppSource;
  ownership: Ownership;
  branding: Branding;
  navigation: Navigation;
  capabilities: Capabilities;
  targets: Targets;
  compliance: Compliance;
  release: ReleaseConfiguration;
}
