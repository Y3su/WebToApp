/**
 * Immutable, cross-platform input to a WebToApp build.
 */
export interface AppSpecV1 {
  branding: Branding;
  capabilities: Capabilities;
  compliance: Compliance;
  identity: Identity;
  navigation: Navigation;
  ownership: Ownership;
  release: Release;
  schemaVersion: SchemaVersion;
  source: Source;
  targets: Targets;
}

export interface Branding {
  backgroundColor: string;
  iconUrl: string;
  primaryColor: string;
  splash?: Splash;
}

export interface Splash {
  backgroundColor: string;
  imageUrl?: string;
}

export interface Capabilities {
  camera: Camera;
  files: Files;
  location: Camera;
  microphone: Camera;
  notifications: Camera;
  push: Push;
  share: Camera;
}

export interface Camera {
  enabled: boolean;
  rationale?: string;
}

export interface Files {
  downloads?: boolean;
  enabled: boolean;
  rationale?: string;
  uploads?: boolean;
}

export interface Push {
  enabled: boolean;
  rationale?: string;
  tokenEndpoint?: string;
}

export interface Compliance {
  accountDeletionUrl?: string;
  ageRating: AgeRating;
  dataPractices: DataPractice[];
  privacyPolicyUrl: string;
  reviewerNotes?: string;
  supportUrl: string;
}

export enum AgeRating {
  The12 = "12+",
  The17 = "17+",
  The4 = "4+",
  The9 = "9+",
}

export enum DataPractice {
  Account = "account",
  Contact = "contact",
  Diagnostics = "diagnostics",
  Financial = "financial",
  Health = "health",
  Identifiers = "identifiers",
  Location = "location",
  Usage = "usage",
  UserContent = "user-content",
}

export interface Identity {
  buildNumber: number;
  displayName: string;
  platformIdentifiers: PlatformIdentifiers;
  slug: string;
  version: string;
}

export interface PlatformIdentifiers {
  android?: string;
  ios?: string;
  linux?: string;
  macos?: string;
  windows?: string;
}

export interface Navigation {
  allowedOrigins: string[];
  externalLinks: ExternalLinks;
  native: Native;
  oauthOrigins: string[];
}

export enum ExternalLinks {
  Block = "block",
  System = "system",
}

export interface Native {
  items: AppSpecV[];
  mode: Mode;
}

export interface AppSpecV {
  icon?: string;
  id: string;
  label: string;
  url: string;
}

export enum Mode {
  None = "none",
  Sidebar = "sidebar",
  Tabs = "tabs",
}

export interface Ownership {
  verificationRecordIds: string[];
  verifiedDomains: string[];
}

export interface Release {
  channel: Channel;
  updatePolicy: UpdatePolicy;
}

export enum Channel {
  Beta = "beta",
  Internal = "internal",
  Stable = "stable",
}

export enum UpdatePolicy {
  Manual = "manual",
  SignedFeed = "signed-feed",
  Store = "store",
}

export enum SchemaVersion {
  The10 = "1.0",
}

export interface Source {
  kind: Kind;
  startUrl?: string;
  artifactSha256?: string;
}

export enum Kind {
  Static = "static",
  URL = "url",
}

export interface Targets {
  android?: Android;
  ios?: Ios;
  linux?: Linux;
  macos?: Macos;
  windows?: Windows;
}

export interface Android {
  formats: AndroidFormat[];
  minSdk: number;
  signingReferenceId?: string;
  targetApi: number;
}

export enum AndroidFormat {
  Aab = "aab",
  Apk = "apk",
}

export interface Ios {
  formats: IosFormat[];
  minVersion: string;
  signingReferenceId?: string;
}

export enum IosFormat {
  Archive = "archive",
  Ipa = "ipa",
  Xcode = "xcode",
}

export interface Linux {
  architectures: LinuxArchitecture[];
  formats: LinuxFormat[];
  signingReferenceId?: string;
}

export enum LinuxArchitecture {
  Arm64 = "arm64",
  X64 = "x64",
}

export enum LinuxFormat {
  Appimage = "appimage",
  Deb = "deb",
}

export interface Macos {
  architectures: MacosArchitecture[];
  formats: MacosFormat[];
  minVersion: string;
  signingReferenceId?: string;
}

export enum MacosArchitecture {
  Arm64 = "arm64",
  Universal = "universal",
  X64 = "x64",
}

export enum MacosFormat {
  App = "app",
  Dmg = "dmg",
}

export interface Windows {
  architectures: LinuxArchitecture[];
  formats: WindowsFormat[];
  minVersion: string;
  signingReferenceId?: string;
}

export enum WindowsFormat {
  Msix = "msix",
  Nsis = "nsis",
}
