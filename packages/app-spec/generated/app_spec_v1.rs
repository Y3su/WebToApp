// Example code that deserializes and serializes the model.
// extern crate serde;
// #[macro_use]
// extern crate serde_derive;
// extern crate serde_json;
//
// use generated_module::AppSpecV1;
//
// fn main() {
//     let json = r#"{"answer": 42}"#;
//     let model: AppSpecV1 = serde_json::from_str(&json).unwrap();
// }

use serde::{Deserialize, Serialize};

/// Immutable, cross-platform input to a WebToApp build.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSpecV1 {
    pub branding: Branding,

    pub capabilities: Capabilities,

    pub compliance: Compliance,

    pub identity: Identity,

    pub navigation: Navigation,

    pub ownership: Ownership,

    pub release: Release,

    pub schema_version: SchemaVersion,

    pub source: Source,

    pub targets: Targets,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Branding {
    pub background_color: String,

    pub icon_url: String,

    pub primary_color: String,

    pub splash: Option<Splash>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Splash {
    pub background_color: String,

    pub image_url: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Capabilities {
    pub camera: Camera,

    pub files: Files,

    pub location: Camera,

    pub microphone: Camera,

    pub notifications: Camera,

    pub push: Push,

    pub share: Camera,
}

#[derive(Serialize, Deserialize)]
pub struct Camera {
    pub enabled: bool,

    pub rationale: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Files {
    pub downloads: Option<bool>,

    pub enabled: bool,

    pub rationale: Option<String>,

    pub uploads: Option<bool>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Push {
    pub enabled: bool,

    pub rationale: Option<String>,

    pub token_endpoint: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Compliance {
    pub account_deletion_url: Option<String>,

    pub age_rating: AgeRating,

    pub data_practices: Vec<DataPractice>,

    pub privacy_policy_url: String,

    pub reviewer_notes: Option<String>,

    pub support_url: String,
}

#[derive(Serialize, Deserialize)]
pub enum AgeRating {
    #[serde(rename = "12+")]
    The12,

    #[serde(rename = "17+")]
    The17,

    #[serde(rename = "4+")]
    The4,

    #[serde(rename = "9+")]
    The9,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum DataPractice {
    Account,

    Contact,

    Diagnostics,

    Financial,

    Health,

    Identifiers,

    Location,

    Usage,

    #[serde(rename = "user-content")]
    UserContent,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Identity {
    pub build_number: i64,

    pub display_name: String,

    pub platform_identifiers: PlatformIdentifiers,

    pub slug: String,

    pub version: String,
}

#[derive(Serialize, Deserialize)]
pub struct PlatformIdentifiers {
    pub android: Option<String>,

    pub ios: Option<String>,

    pub linux: Option<String>,

    pub macos: Option<String>,

    pub windows: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Navigation {
    pub allowed_origins: Vec<String>,

    pub external_links: ExternalLinks,

    pub native: Native,

    pub oauth_origins: Vec<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExternalLinks {
    Block,

    System,
}

#[derive(Serialize, Deserialize)]
pub struct Native {
    pub items: Vec<AppSpecV>,

    pub mode: Mode,
}

#[derive(Serialize, Deserialize)]
pub struct AppSpecV {
    pub icon: Option<String>,

    pub id: String,

    pub label: String,

    pub url: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Mode {
    None,

    Sidebar,

    Tabs,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ownership {
    pub verification_record_ids: Vec<String>,

    pub verified_domains: Vec<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Release {
    pub channel: Channel,

    pub update_policy: UpdatePolicy,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Channel {
    Beta,

    Internal,

    Stable,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum UpdatePolicy {
    Manual,

    #[serde(rename = "signed-feed")]
    SignedFeed,

    Store,
}

#[derive(Serialize, Deserialize)]
pub enum SchemaVersion {
    #[serde(rename = "1.0")]
    The10,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Source {
    pub kind: Kind,

    pub start_url: Option<String>,

    pub artifact_sha256: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Kind {
    Static,

    Url,
}

#[derive(Serialize, Deserialize)]
pub struct Targets {
    pub android: Option<Android>,

    pub ios: Option<Ios>,

    pub linux: Option<Linux>,

    pub macos: Option<Macos>,

    pub windows: Option<Windows>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Android {
    pub formats: Vec<AndroidFormat>,

    pub min_sdk: i64,

    pub signing_reference_id: Option<String>,

    pub target_api: i64,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AndroidFormat {
    Aab,

    Apk,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ios {
    pub formats: Vec<IosFormat>,

    pub min_version: String,

    pub signing_reference_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum IosFormat {
    Archive,

    Ipa,

    Xcode,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Linux {
    pub architectures: Vec<LinuxArchitecture>,

    pub formats: Vec<LinuxFormat>,

    pub signing_reference_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LinuxArchitecture {
    Arm64,

    X64,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LinuxFormat {
    Appimage,

    Deb,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Macos {
    pub architectures: Vec<MacosArchitecture>,

    pub formats: Vec<MacosFormat>,

    pub min_version: String,

    pub signing_reference_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MacosArchitecture {
    Arm64,

    Universal,

    X64,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MacosFormat {
    App,

    Dmg,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Windows {
    pub architectures: Vec<LinuxArchitecture>,

    pub formats: Vec<WindowsFormat>,

    pub min_version: String,

    pub signing_reference_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WindowsFormat {
    Msix,

    Nsis,
}
