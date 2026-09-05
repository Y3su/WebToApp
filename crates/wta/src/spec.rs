use std::{
    collections::BTreeMap,
    net::{Ipv4Addr, Ipv6Addr},
};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use url::{Host, Url};

use crate::{
    digest::{canonical_json_bytes, sha256_bytes},
    error::CliError,
    safe_io::{read_regular_file_limited, MAX_SPEC_BYTES},
};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct AppSpecV1 {
    pub schema_version: String,
    pub identity: Identity,
    pub source: Source,
    pub ownership: Ownership,
    pub branding: Branding,
    pub navigation: Navigation,
    pub capabilities: Capabilities,
    pub targets: Targets,
    pub compliance: Compliance,
    pub release: Release,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Identity {
    pub display_name: String,
    pub slug: String,
    pub version: String,
    pub build_number: u64,
    pub platform_identifiers: PlatformIdentifiers,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct PlatformIdentifiers {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub android: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ios: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub windows: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub macos: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub linux: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(
    deny_unknown_fields,
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    tag = "kind"
)]
pub enum Source {
    #[serde(rename = "url")]
    Url { start_url: String },
    #[serde(rename = "static")]
    Static { artifact_sha256: String },
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Ownership {
    pub verified_domains: Vec<String>,
    pub verification_record_ids: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Branding {
    pub primary_color: String,
    pub background_color: String,
    pub icon_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub splash: Option<Value>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Navigation {
    pub allowed_origins: Vec<String>,
    pub oauth_origins: Vec<String>,
    pub external_links: ExternalLinks,
    pub native: NativeNavigation,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ExternalLinks {
    System,
    Block,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct NativeNavigation {
    pub mode: NativeNavigationMode,
    pub items: Vec<Value>,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum NativeNavigationMode {
    None,
    Tabs,
    Sidebar,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Capabilities {
    pub push: Value,
    pub share: Value,
    pub files: Value,
    pub camera: Value,
    pub microphone: Value,
    pub location: Value,
    pub notifications: Value,
}

impl Capabilities {
    pub fn entries(&self) -> [(&'static str, &Value); 7] {
        [
            ("push", &self.push),
            ("share", &self.share),
            ("files", &self.files),
            ("camera", &self.camera),
            ("microphone", &self.microphone),
            ("location", &self.location),
            ("notifications", &self.notifications),
        ]
    }

    #[must_use]
    pub fn any_enabled(&self) -> bool {
        self.entries()
            .iter()
            .any(|(_, value)| capability_enabled(value))
    }
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Targets {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub android: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ios: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub windows: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub macos: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub linux: Option<Value>,
}

impl Targets {
    #[must_use]
    pub fn enabled_names(&self) -> Vec<&'static str> {
        [
            ("android", self.android.as_ref()),
            ("ios", self.ios.as_ref()),
            ("windows", self.windows.as_ref()),
            ("macos", self.macos.as_ref()),
            ("linux", self.linux.as_ref()),
        ]
        .into_iter()
        .filter_map(|(name, value)| value.map(|_| name))
        .collect()
    }

    fn entries(&self) -> [(&'static str, Option<&Value>); 5] {
        [
            ("android", self.android.as_ref()),
            ("ios", self.ios.as_ref()),
            ("windows", self.windows.as_ref()),
            ("macos", self.macos.as_ref()),
            ("linux", self.linux.as_ref()),
        ]
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Compliance {
    pub privacy_policy_url: String,
    pub support_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub account_deletion_url: Option<String>,
    pub data_practices: Vec<Value>,
    pub age_rating: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reviewer_notes: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Release {
    pub channel: ReleaseChannel,
    pub update_policy: UpdatePolicy,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ReleaseChannel {
    Internal,
    Beta,
    Stable,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum UpdatePolicy {
    Store,
    SignedFeed,
    Manual,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationIssue {
    pub path: String,
    pub code: String,
    pub message: String,
}

#[derive(Clone, Debug)]
pub struct ValidatedSpec {
    pub spec: AppSpecV1,
    pub digest: String,
}

impl ValidatedSpec {
    pub fn load(path: &std::path::Path) -> Result<Self, CliError> {
        let bytes = read_regular_file_limited(path, MAX_SPEC_BYTES)?;
        let document: Value = serde_json::from_slice(&bytes)
            .map_err(|error| CliError::InvalidSpec(error.to_string()))?;
        let schema: Value = serde_json::from_str(include_str!(
            "../../../packages/app-spec/src/app-spec-v1.schema.json"
        ))
        .map_err(|error| CliError::InvalidSpec(error.to_string()))?;
        let validator = jsonschema::validator_for(&schema)
            .map_err(|error| CliError::InvalidSpec(error.to_string()))?;
        if let Err(error) = validator.validate(&document) {
            return Err(CliError::Validation(format!(
                "{}: {error}",
                error.instance_path
            )));
        }
        let spec: AppSpecV1 = serde_json::from_slice(&bytes)
            .map_err(|error| CliError::InvalidSpec(format!("{}: {error}", path.display())))?;
        let issues = validate(&spec);
        if !issues.is_empty() {
            let rendered = issues
                .iter()
                .map(|issue| format!("{} [{}]: {}", issue.path, issue.code, issue.message))
                .collect::<Vec<_>>()
                .join("\n");
            return Err(CliError::Validation(rendered));
        }
        let value = serde_json::to_value(&spec)
            .map_err(|error| CliError::InvalidSpec(format!("cannot normalize AppSpec: {error}")))?;
        let canonical = canonical_json_bytes(&value)?;
        Ok(Self {
            spec,
            digest: sha256_bytes(&canonical),
        })
    }
}

#[must_use]
pub fn validate(spec: &AppSpecV1) -> Vec<ValidationIssue> {
    let mut issues = Vec::new();
    if spec.schema_version != "1.0" {
        issue(
            &mut issues,
            "schemaVersion",
            "unsupported_schema",
            "must be exactly `1.0`",
        );
    }

    validate_identity(&spec.identity, &mut issues);
    let start_origin = validate_source(&spec.source, &mut issues);
    validate_ownership(&spec.ownership, &mut issues);
    validate_branding(&spec.branding, &mut issues);
    validate_navigation(&spec.navigation, start_origin.as_deref(), &mut issues);
    validate_capabilities(&spec.capabilities, &mut issues);
    validate_targets(&spec.targets, &mut issues);
    validate_compliance(&spec.compliance, &mut issues);
    issues
}

fn validate_identity(identity: &Identity, issues: &mut Vec<ValidationIssue>) {
    let name = identity.display_name.trim();
    if name.is_empty() || name.chars().count() > 80 {
        issue(
            issues,
            "identity.displayName",
            "invalid_name",
            "must contain 1 to 80 characters",
        );
    }
    if !valid_slug(&identity.slug) {
        issue(
            issues,
            "identity.slug",
            "invalid_slug",
            "must be 1 to 63 lowercase ASCII letters, digits, or hyphens and cannot start or end with a hyphen",
        );
    }
    if !valid_semver(&identity.version) {
        issue(
            issues,
            "identity.version",
            "invalid_version",
            "must be a semantic version such as `1.2.3`",
        );
    }
    if identity.build_number == 0 {
        issue(
            issues,
            "identity.buildNumber",
            "invalid_build_number",
            "must be at least 1",
        );
    }

    for (platform, identifier) in [
        ("android", identity.platform_identifiers.android.as_deref()),
        ("ios", identity.platform_identifiers.ios.as_deref()),
        ("windows", identity.platform_identifiers.windows.as_deref()),
        ("macos", identity.platform_identifiers.macos.as_deref()),
        ("linux", identity.platform_identifiers.linux.as_deref()),
    ] {
        if let Some(identifier) = identifier {
            if !valid_platform_identifier(identifier) {
                issue(
                    issues,
                    &format!("identity.platformIdentifiers.{platform}"),
                    "invalid_identifier",
                    "must be a conservative reverse-DNS identifier (for example `com.example.my_app`)",
                );
            }
        }
    }
}

fn validate_source(source: &Source, issues: &mut Vec<ValidationIssue>) -> Option<String> {
    match source {
        Source::Url { start_url } => match secure_https_url(start_url) {
            Ok(url) => {
                if let Err(message) = public_target(&url) {
                    issue(issues, "source.startUrl", "unsafe_network_target", &message);
                }
                Some(url.origin().ascii_serialization())
            }
            Err(message) => {
                issue(issues, "source.startUrl", "invalid_https_url", &message);
                None
            }
        },
        Source::Static { artifact_sha256 } => {
            if !valid_sha256(artifact_sha256) {
                issue(
                    issues,
                    "source.artifactSha256",
                    "invalid_digest",
                    "must be exactly 64 lowercase hexadecimal characters",
                );
            }
            None
        }
    }
}

fn validate_ownership(ownership: &Ownership, issues: &mut Vec<ValidationIssue>) {
    for (index, domain) in ownership.verified_domains.iter().enumerate() {
        let path = format!("ownership.verifiedDomains[{index}]");
        if domain != &domain.to_ascii_lowercase()
            || domain.contains('/')
            || domain.contains(':')
            || domain.contains('*')
        {
            issue(
                issues,
                &path,
                "invalid_domain",
                "must be a lowercase exact hostname without scheme, port, path, or wildcard",
            );
            continue;
        }
        match Url::parse(&format!("https://{domain}")) {
            Ok(url) if url.host_str() == Some(domain.as_str()) => {
                if let Err(message) = public_target(&url) {
                    issue(issues, &path, "unsafe_network_target", &message);
                }
            }
            _ => issue(
                issues,
                &path,
                "invalid_domain",
                "must be a valid exact hostname",
            ),
        }
    }
}

fn validate_branding(branding: &Branding, issues: &mut Vec<ValidationIssue>) {
    for (path, color) in [
        ("branding.primaryColor", branding.primary_color.as_str()),
        (
            "branding.backgroundColor",
            branding.background_color.as_str(),
        ),
    ] {
        if !valid_hex_color(color) {
            issue(
                issues,
                path,
                "invalid_color",
                "must use `#RRGGBB` or `#RRGGBBAA` hexadecimal notation",
            );
        }
    }
    validate_web_url("branding.iconUrl", &branding.icon_url, issues);
}

fn validate_navigation(
    navigation: &Navigation,
    start_origin: Option<&str>,
    issues: &mut Vec<ValidationIssue>,
) {
    if start_origin.is_some() && navigation.allowed_origins.is_empty() {
        issue(
            issues,
            "navigation.allowedOrigins",
            "missing_origin",
            "must contain at least one exact HTTPS origin",
        );
    }
    let mut normalized_allowed = Vec::new();
    for (index, origin) in navigation.allowed_origins.iter().enumerate() {
        let path = format!("navigation.allowedOrigins[{index}]");
        if let Some(normalized) = validate_exact_origin(&path, origin, issues) {
            normalized_allowed.push(normalized);
        }
    }
    for (index, origin) in navigation.oauth_origins.iter().enumerate() {
        validate_exact_origin(&format!("navigation.oauthOrigins[{index}]"), origin, issues);
    }
    if let Some(start_origin) = start_origin {
        if !normalized_allowed
            .iter()
            .any(|origin| origin == start_origin)
        {
            issue(
                issues,
                "navigation.allowedOrigins",
                "start_origin_missing",
                "must include the exact origin of `source.startUrl`",
            );
        }
    }
    if navigation.native.mode == NativeNavigationMode::None && !navigation.native.items.is_empty() {
        issue(
            issues,
            "navigation.native.items",
            "unused_navigation_items",
            "must be empty when native navigation mode is `none`",
        );
    }
}

fn validate_capabilities(capabilities: &Capabilities, issues: &mut Vec<ValidationIssue>) {
    for (name, value) in capabilities.entries() {
        let valid = value.is_boolean()
            || value
                .as_object()
                .and_then(|object| object.get("enabled"))
                .is_some_and(Value::is_boolean);
        if !valid {
            issue(
                issues,
                &format!("capabilities.{name}"),
                "invalid_capability",
                "must be a boolean or an object containing a boolean `enabled` property",
            );
        }
    }
}

fn validate_targets(targets: &Targets, issues: &mut Vec<ValidationIssue>) {
    if targets.enabled_names().is_empty() {
        issue(
            issues,
            "targets",
            "missing_target",
            "must configure at least one target platform",
        );
    }
    for (name, value) in targets.entries() {
        if value.is_some_and(|target| !target.is_object()) {
            issue(
                issues,
                &format!("targets.{name}"),
                "invalid_target",
                "must be a target configuration object",
            );
        }
    }
}

fn validate_compliance(compliance: &Compliance, issues: &mut Vec<ValidationIssue>) {
    validate_web_url(
        "compliance.privacyPolicyUrl",
        &compliance.privacy_policy_url,
        issues,
    );
    validate_web_url("compliance.supportUrl", &compliance.support_url, issues);
    if let Some(url) = &compliance.account_deletion_url {
        validate_web_url("compliance.accountDeletionUrl", url, issues);
    }
    if compliance.age_rating.trim().is_empty() || compliance.age_rating.chars().count() > 64 {
        issue(
            issues,
            "compliance.ageRating",
            "invalid_age_rating",
            "must contain 1 to 64 characters",
        );
    }
}

fn validate_web_url(path: &str, value: &str, issues: &mut Vec<ValidationIssue>) {
    match secure_https_url(value) {
        Ok(url) => {
            if let Err(message) = public_target(&url) {
                issue(issues, path, "unsafe_network_target", &message);
            }
        }
        Err(message) => issue(issues, path, "invalid_https_url", &message),
    }
}

fn validate_exact_origin(
    path: &str,
    value: &str,
    issues: &mut Vec<ValidationIssue>,
) -> Option<String> {
    let url = match secure_https_url(value) {
        Ok(url) => url,
        Err(message) => {
            issue(issues, path, "invalid_https_origin", &message);
            return None;
        }
    };
    let origin = url.origin().ascii_serialization();
    if url.path() != "/"
        || url.query().is_some()
        || url.fragment().is_some()
        || value.trim_end_matches('/') != origin
    {
        issue(
            issues,
            path,
            "origin_not_exact",
            "must contain only scheme, hostname, and optional port; paths, queries, fragments, and wildcards are forbidden",
        );
        return None;
    }
    if let Err(message) = public_target(&url) {
        issue(issues, path, "unsafe_network_target", &message);
        return None;
    }
    Some(origin)
}

pub fn secure_https_url(value: &str) -> Result<Url, String> {
    let url = Url::parse(value).map_err(|error| format!("must be an absolute URL: {error}"))?;
    if url.scheme() != "https" {
        return Err("must use HTTPS".into());
    }
    if url.host().is_none() {
        return Err("must include a hostname".into());
    }
    if !url.username().is_empty() || url.password().is_some() {
        return Err("embedded credentials are forbidden".into());
    }
    Ok(url)
}

pub fn public_target(url: &Url) -> Result<(), String> {
    match url.host() {
        Some(Host::Domain(domain)) => {
            let lower = domain.to_ascii_lowercase();
            if lower == "localhost"
                || lower.ends_with(".localhost")
                || lower.rsplit('.').next() == Some("local")
                || lower.ends_with(".internal")
                || lower.ends_with(".home.arpa")
            {
                return Err("local and internal hostnames are forbidden".into());
            }
            Ok(())
        }
        Some(Host::Ipv4(address)) if public_ipv4(address) => Ok(()),
        Some(Host::Ipv6(address)) if public_ipv6(address) => Ok(()),
        Some(Host::Ipv4(_) | Host::Ipv6(_)) => Err(
            "private, loopback, link-local, multicast, and reserved IP addresses are forbidden"
                .into(),
        ),
        None => Err("must include a hostname".into()),
    }
}

fn public_ipv4(address: Ipv4Addr) -> bool {
    let [a, b, c, _] = address.octets();
    !(a == 0
        || a == 10
        || a == 127
        || (a == 169 && b == 254)
        || (a == 172 && (16..=31).contains(&b))
        || (a == 192 && b == 168)
        || (a == 100 && (64..=127).contains(&b))
        || (a == 192 && b == 0 && c == 0)
        || (a == 192 && b == 0 && c == 2)
        || (a == 198 && (b == 18 || b == 19))
        || (a == 198 && b == 51 && c == 100)
        || (a == 203 && b == 0 && c == 113)
        || a >= 224)
}

fn public_ipv6(address: Ipv6Addr) -> bool {
    let segments = address.segments();
    if address.is_unspecified() || address.is_loopback() {
        return false;
    }
    let unique_local = (segments[0] & 0xfe00) == 0xfc00;
    let link_local = (segments[0] & 0xffc0) == 0xfe80;
    let multicast = (segments[0] & 0xff00) == 0xff00;
    let documentation = segments[0] == 0x2001 && segments[1] == 0x0db8;
    let ipv4_mapped = segments[..5] == [0, 0, 0, 0, 0] && segments[5] == 0xffff;
    if ipv4_mapped {
        let mapped = Ipv4Addr::new(
            u8::try_from(segments[6] >> 8).unwrap_or_default(),
            u8::try_from(segments[6] & 0xff).unwrap_or_default(),
            u8::try_from(segments[7] >> 8).unwrap_or_default(),
            u8::try_from(segments[7] & 0xff).unwrap_or_default(),
        );
        return public_ipv4(mapped);
    }
    !(unique_local || link_local || multicast || documentation)
}

fn capability_enabled(value: &Value) -> bool {
    value.as_bool().unwrap_or_else(|| {
        value
            .as_object()
            .and_then(|object| object.get("enabled"))
            .and_then(Value::as_bool)
            .unwrap_or(false)
    })
}

#[must_use]
pub fn valid_sha256(value: &str) -> bool {
    value.len() == 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

#[must_use]
pub fn slugify(value: &str) -> String {
    let mut slug = String::with_capacity(value.len());
    let mut previous_hyphen = false;
    for character in value.chars() {
        if character.is_ascii_alphanumeric() {
            slug.push(character.to_ascii_lowercase());
            previous_hyphen = false;
        } else if !previous_hyphen && !slug.is_empty() {
            slug.push('-');
            previous_hyphen = true;
        }
        if slug.len() >= 63 {
            break;
        }
    }
    slug.trim_matches('-').to_owned()
}

#[must_use]
pub fn valid_platform_identifier(value: &str) -> bool {
    let segments: Vec<_> = value.split('.').collect();
    segments.len() >= 2
        && value.len() <= 255
        && segments.iter().all(|segment| {
            !segment.is_empty()
                && segment
                    .bytes()
                    .next()
                    .is_some_and(|byte| byte.is_ascii_alphabetic())
                && segment
                    .bytes()
                    .all(|byte| byte.is_ascii_alphanumeric() || byte == b'_')
        })
}

fn valid_slug(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 63
        && !value.starts_with('-')
        && !value.ends_with('-')
        && value
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
}

fn valid_semver(value: &str) -> bool {
    let core = value.split_once('+').map_or(value, |(left, _)| left);
    let core = core.split_once('-').map_or(core, |(left, _)| left);
    let components: Vec<_> = core.split('.').collect();
    components.len() == 3
        && components.iter().all(|component| {
            !component.is_empty()
                && component.bytes().all(|byte| byte.is_ascii_digit())
                && (component == &"0" || !component.starts_with('0'))
        })
}

fn valid_hex_color(value: &str) -> bool {
    matches!(value.len(), 7 | 9)
        && value.starts_with('#')
        && value[1..].bytes().all(|byte| byte.is_ascii_hexdigit())
}

fn issue(issues: &mut Vec<ValidationIssue>, path: &str, code: &str, message: &str) {
    issues.push(ValidationIssue {
        path: path.to_owned(),
        code: code.to_owned(),
        message: message.to_owned(),
    });
}

pub fn sorted_capability_map(capabilities: &Capabilities) -> BTreeMap<String, bool> {
    capabilities
        .entries()
        .into_iter()
        .map(|(name, value)| (name.to_owned(), capability_enabled(value)))
        .collect()
}

#[cfg(test)]
mod tests {
    use url::Url;

    use super::{public_target, slugify, valid_platform_identifier, valid_sha256};

    #[test]
    fn blocks_private_and_local_network_targets() {
        for value in [
            "https://localhost",
            "https://service.internal",
            "https://127.0.0.1",
            "https://10.0.0.1",
            "https://[::1]",
            "https://[fd00::1]",
        ] {
            assert!(
                public_target(&Url::parse(value).unwrap()).is_err(),
                "{value}"
            );
        }
    }

    #[test]
    fn permits_public_network_targets() {
        for value in [
            "https://example.com",
            "https://1.1.1.1",
            "https://[2606:4700:4700::1111]",
        ] {
            assert!(
                public_target(&Url::parse(value).unwrap()).is_ok(),
                "{value}"
            );
        }
    }

    #[test]
    fn slug_is_stable_and_bounded() {
        assert_eq!(slugify("  My Great App!  "), "my-great-app");
        assert!(slugify(&"a".repeat(100)).len() <= 63);
    }

    #[test]
    fn validates_digest_and_identifier() {
        assert!(valid_sha256(&"a".repeat(64)));
        assert!(!valid_sha256(&"A".repeat(64)));
        assert!(valid_platform_identifier("com.example.my_app"));
        assert!(!valid_platform_identifier("com.example.bad-name"));
    }
}
