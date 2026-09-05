use std::{
    collections::BTreeMap,
    fmt::Write as _,
    path::Path,
    process::{Command as ProcessCommand, Stdio},
};

use serde::Serialize;
use serde_json::json;

use crate::{
    cli::{
        AnalyzeArgs, ArtifactCommand, ArtifactVerifyArgs, BuildArgs, BuildTarget, DoctorArgs,
        InitArgs, RunnerCommand, RunnerEnrollArgs, RunnerStartArgs, SpecArgs,
    },
    digest::sha256_file,
    error::CliError,
    safe_io::{ensure_output_directory, validate_path_syntax, write_regular_file},
    spec::{
        public_target, secure_https_url, slugify, sorted_capability_map, valid_platform_identifier,
        valid_sha256, AppSpecV1, Branding, Capabilities, Compliance, ExternalLinks, Identity,
        NativeNavigation, NativeNavigationMode, Navigation, Ownership, PlatformIdentifiers,
        Release, ReleaseChannel, Source, Targets, UpdatePolicy, ValidatedSpec,
    },
};

#[allow(clippy::too_many_lines)] // Keep the declarative starter document together.
pub fn init(args: &InitArgs) -> Result<String, CliError> {
    let display_name = args.name.trim();
    if display_name.is_empty() || display_name.chars().count() > 80 {
        return Err(CliError::Validation(
            "--name must contain 1 to 80 characters".into(),
        ));
    }
    let start_url = secure_https_url(&args.url)
        .map_err(|message| CliError::Validation(format!("--url: {message}")))?;
    public_target(&start_url)
        .map_err(|message| CliError::Validation(format!("--url: {message}")))?;

    let identifier_base = args.identifier_base.trim().trim_end_matches('.');
    if !valid_platform_identifier(identifier_base) {
        return Err(CliError::Validation(
            "--identifier-base must be a conservative reverse-DNS identifier such as `com.example`"
                .into(),
        ));
    }
    let slug = slugify(display_name);
    if slug.is_empty() {
        return Err(CliError::Validation(
            "--name must contain at least one ASCII letter or digit so a stable slug can be generated"
                .into(),
        ));
    }
    let identifier_slug = slug.replace('-', "");
    let identifier = format!("{identifier_base}.{identifier_slug}");
    if !valid_platform_identifier(&identifier) {
        return Err(CliError::Validation(
            "generated platform identifier is invalid; choose a shorter name or identifier base"
                .into(),
        ));
    }

    let origin = start_url.origin().ascii_serialization();
    let origin_url = secure_https_url(&origin)
        .map_err(|message| CliError::Validation(format!("--url origin: {message}")))?;
    let icon_url = origin_url
        .join("/favicon.ico")
        .map_err(|error| CliError::Validation(format!("cannot create icon URL: {error}")))?
        .to_string();
    let privacy_url = origin_url
        .join("/privacy")
        .map_err(|error| CliError::Validation(format!("cannot create privacy URL: {error}")))?
        .to_string();
    let support_url = origin_url
        .join("/support")
        .map_err(|error| CliError::Validation(format!("cannot create support URL: {error}")))?
        .to_string();

    let spec = AppSpecV1 {
        schema_version: "1.0".into(),
        identity: Identity {
            display_name: display_name.to_owned(),
            slug,
            version: "0.1.0".into(),
            build_number: 1,
            platform_identifiers: PlatformIdentifiers {
                windows: Some(identifier.clone()),
                ..PlatformIdentifiers::default()
            },
        },
        source: Source::Url {
            start_url: start_url.to_string(),
        },
        ownership: Ownership {
            verified_domains: Vec::new(),
            verification_record_ids: Vec::new(),
        },
        branding: Branding {
            primary_color: "#0B57D0".into(),
            background_color: "#FFFFFF".into(),
            icon_url,
            splash: None,
        },
        navigation: Navigation {
            allowed_origins: vec![origin],
            oauth_origins: Vec::new(),
            external_links: ExternalLinks::System,
            native: NativeNavigation {
                mode: NativeNavigationMode::None,
                items: Vec::new(),
            },
        },
        capabilities: Capabilities {
            push: json!({"enabled": false}),
            share: json!({"enabled": false}),
            files: json!({"enabled": false}),
            camera: json!({"enabled": false}),
            microphone: json!({"enabled": false}),
            location: json!({"enabled": false}),
            notifications: json!({"enabled": false}),
        },
        targets: Targets {
            windows: Some(json!({
                "architectures": ["x64"],
                "formats": ["nsis"],
                "minVersion": "10"
            })),
            ..Targets::default()
        },
        compliance: Compliance {
            privacy_policy_url: privacy_url,
            support_url,
            account_deletion_url: None,
            data_practices: Vec::new(),
            age_rating: "17+".into(),
            reviewer_notes: Some(
                "Draft: complete store age-rating questionnaires and ownership verification."
                    .into(),
            ),
        },
        release: Release {
            channel: ReleaseChannel::Internal,
            update_policy: UpdatePolicy::Manual,
        },
    };

    let mut contents = serde_json::to_vec_pretty(&spec).map_err(|error| {
        CliError::InvalidSpec(format!("cannot serialize starter AppSpec: {error}"))
    })?;
    contents.push(b'\n');
    write_regular_file(&args.output, &contents, args.force)?;
    Ok(format!(
        "Created {}\nNext: review ownership, compliance, capabilities, and targets, then run `wta validate {}`.",
        args.output.display(),
        shell_neutral_path(&args.output)
    ))
}

pub fn validate_spec(args: &SpecArgs) -> Result<String, CliError> {
    let validated = ValidatedSpec::load(&args.spec)?;
    let result = ValidationResult {
        valid: true,
        schema_version: validated.spec.schema_version,
        sha256: validated.digest,
        targets: validated
            .spec
            .targets
            .enabled_names()
            .into_iter()
            .map(str::to_owned)
            .collect(),
    };
    if args.json {
        pretty_json(&result)
    } else {
        Ok(format!(
            "Valid AppSpec {}\nSHA-256: {}\nTargets: {}",
            result.schema_version,
            result.sha256,
            result.targets.join(", ")
        ))
    }
}

pub fn analyze(args: &AnalyzeArgs) -> Result<String, CliError> {
    let validated = ValidatedSpec::load(&args.spec)?;
    let mut findings = Vec::new();

    match &validated.spec.source {
        Source::Url { start_url } => {
            let url = secure_https_url(start_url)
                .map_err(|message| CliError::Validation(format!("source.startUrl: {message}")))?;
            let domain = url.host_str().unwrap_or_default().to_ascii_lowercase();
            if !validated
                .spec
                .ownership
                .verified_domains
                .iter()
                .any(|verified| verified == &domain)
            {
                findings.push(Finding::required(
                    "ownership.unverified",
                    "The start URL's exact hostname has not been verified.",
                    "Complete DNS TXT or well-known-file verification before a release build.",
                ));
            }
            findings.push(Finding::info(
                "network.offline_analysis",
                "This command validates URL policy without fetching remote content or resolving DNS.",
                "Use the future sandboxed analyzer before treating the app as release-ready.",
            ));
        }
        Source::Static { .. } => findings.push(Finding::info(
            "source.static_digest_only",
            "The static source digest is valid, but archive contents were not supplied to this command.",
            "Run hardened archive inspection when attaching the source artifact.",
        )),
    }

    if validated.spec.navigation.native.mode == NativeNavigationMode::None
        && !validated.spec.capabilities.any_enabled()
    {
        findings.push(Finding::required(
            "store.native_value_missing",
            "No native navigation or native capability is enabled.",
            "Add meaningful native value before labeling the result store-ready.",
        ));
    }

    if validated
        .spec
        .compliance
        .age_rating
        .eq_ignore_ascii_case("unrated")
    {
        findings.push(Finding::required(
            "compliance.age_rating_unset",
            "The starter age rating is still `unrated`.",
            "Complete the age-rating questionnaire for each selected store.",
        ));
    }

    let status = if findings
        .iter()
        .any(|finding| finding.severity == FindingSeverity::ChangesRequired)
    {
        AnalysisStatus::ChangesRequired
    } else {
        AnalysisStatus::Ready
    };
    let report = AnalysisReport {
        report_version: "1.0",
        app_spec_sha256: &validated.digest,
        status,
        findings,
        limitations: vec![
            "No remote content was fetched.".into(),
            "DNS rebinding and redirect protection must be enforced by the future sandboxed fetcher.".into(),
            "Store acceptance is never guaranteed.".into(),
        ],
    };
    if args.json {
        pretty_json(&report)
    } else {
        let mut output = format!(
            "Analysis: {}\nAppSpec SHA-256: {}",
            report.status.as_str(),
            report.app_spec_sha256
        );
        for finding in &report.findings {
            let _ = write!(
                output,
                "\n- [{}] {}: {} Remediation: {}",
                finding.severity.as_str(),
                finding.code,
                finding.message,
                finding.remediation
            );
        }
        Ok(output)
    }
}

pub fn doctor(args: &DoctorArgs) -> Result<String, CliError> {
    let mut checks = vec![DoctorCheck::ok(
        "host",
        format!("{} / {}", std::env::consts::OS, std::env::consts::ARCH),
    )];
    checks.push(probe_tool("rustc", &["--version"], true));
    checks.push(probe_tool("cargo", &["--version"], true));
    checks.push(probe_tool("git", &["--version"], false));

    let supported_host = matches!(std::env::consts::OS, "windows" | "macos" | "linux");
    checks.push(if supported_host {
        DoctorCheck::ok("host-support", "supported developer host".into())
    } else {
        DoctorCheck::warning(
            "host-support",
            "host is not in the initial Windows/macOS/Linux support matrix".into(),
        )
    });
    checks.push(DoctorCheck::warning(
        "packaging",
        "this release emits a Windows developer manifest only; installers and signing are not connected"
            .into(),
    ));

    let ready = checks
        .iter()
        .filter(|check| check.required)
        .all(|check| check.status == CheckStatus::Ok);
    let report = DoctorReport {
        ready,
        checks,
        runner_connected: false,
    };
    if args.json {
        pretty_json(&report)
    } else {
        let mut output = format!(
            "Developer environment: {}",
            if ready { "ready" } else { "needs attention" }
        );
        for check in &report.checks {
            let _ = write!(
                output,
                "\n- [{}] {}: {}",
                check.status.as_str(),
                check.name,
                check.detail
            );
        }
        output.push_str("\nRunner: not connected (transport is not implemented in this release)");
        Ok(output)
    }
}

pub fn build(args: &BuildArgs) -> Result<String, CliError> {
    let validated = ValidatedSpec::load(&args.spec)?;
    match args.target {
        BuildTarget::WindowsDev => build_windows_developer_manifest(&validated, args),
    }
}

fn build_windows_developer_manifest(
    validated: &ValidatedSpec,
    args: &BuildArgs,
) -> Result<String, CliError> {
    if validated.spec.targets.windows.is_none() {
        return Err(CliError::Validation(
            "targets.windows must be configured for `--target windows-dev`".into(),
        ));
    }
    let platform_identifier = validated
        .spec
        .identity
        .platform_identifiers
        .windows
        .clone()
        .ok_or_else(|| {
            CliError::Validation(
                "identity.platformIdentifiers.windows is required for the Windows target".into(),
            )
        })?;

    let source = match &validated.spec.source {
        Source::Url { start_url } => DeveloperSource {
            kind: "url",
            location: start_url.clone(),
        },
        Source::Static { artifact_sha256 } => DeveloperSource {
            kind: "static",
            location: format!("sha256:{artifact_sha256}"),
        },
    };
    let manifest = WindowsDeveloperManifest {
        artifact_type: "webtoapp.windows-developer-manifest",
        artifact_version: "1.0",
        app_spec: ManifestSpecReference {
            schema_version: &validated.spec.schema_version,
            sha256: &validated.digest,
        },
        application: ManifestApplication {
            display_name: &validated.spec.identity.display_name,
            slug: &validated.spec.identity.slug,
            version: &validated.spec.identity.version,
            build_number: validated.spec.identity.build_number,
            platform_identifier,
        },
        source,
        security: ManifestSecurity {
            allowed_origins: validated.spec.navigation.allowed_origins.clone(),
            oauth_origins: validated.spec.navigation.oauth_origins.clone(),
            external_links: match validated.spec.navigation.external_links {
                ExternalLinks::System => "system",
                ExternalLinks::Block => "block",
            },
            native_capabilities: sorted_capability_map(&validated.spec.capabilities),
            remote_tauri_api_enabled: false,
        },
        runtime: ManifestRuntime {
            framework: "tauri",
            major_version: 2,
            webview: "WebView2",
        },
        target: ManifestTarget {
            operating_system: "windows",
            architecture: "x86_64",
            format: "developer-manifest",
        },
        signing: ManifestSigning {
            status: "unsigned",
            required_for_distribution: true,
        },
    };
    let mut contents = serde_json::to_vec_pretty(&manifest).map_err(|error| {
        CliError::InvalidSpec(format!("cannot serialize build manifest: {error}"))
    })?;
    contents.push(b'\n');

    let output_dir = ensure_output_directory(&args.output_dir)?;
    let artifact_path = output_dir.join("webtoapp.windows-dev.manifest.json");
    write_regular_file(&artifact_path, &contents, args.force)?;
    let (artifact_sha256, size) = sha256_file(&artifact_path)?;
    let result = BuildResult {
        target: "windows-dev",
        artifact: artifact_path.display().to_string(),
        artifact_sha256,
        size,
        signed: false,
    };
    if args.json {
        pretty_json(&result)
    } else {
        Ok(format!(
            "Built deterministic Windows developer manifest\nArtifact: {}\nSHA-256: {}\nSigning: unsigned (not suitable for distribution)",
            result.artifact, result.artifact_sha256
        ))
    }
}

pub fn runner(command: &RunnerCommand) -> Result<String, CliError> {
    match command {
        RunnerCommand::Enroll(args) => runner_enroll(args),
        RunnerCommand::Start(args) => runner_start(args),
    }
}

fn runner_enroll(args: &RunnerEnrollArgs) -> Result<String, CliError> {
    let control_plane = secure_https_url(&args.control_plane)
        .map_err(|message| CliError::Validation(format!("--control-plane: {message}")))?;
    public_target(&control_plane)
        .map_err(|message| CliError::Validation(format!("--control-plane: {message}")))?;
    if args.organization.is_empty()
        || args.organization.len() > 128
        || !args
            .organization
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
    {
        return Err(CliError::Validation(
            "--organization must contain 1 to 128 ASCII letters, digits, hyphens, or underscores"
                .into(),
        ));
    }
    validate_path_syntax(&args.state_dir)?;
    Err(CliError::Unsupported(
        "secure runner enrollment is not connected in v0.1.0-alpha.1; no request was sent and no credentials or state were written"
            .into(),
    ))
}

fn runner_start(args: &RunnerStartArgs) -> Result<String, CliError> {
    validate_path_syntax(&args.state_dir)?;
    Err(CliError::Unsupported(
        "runner transport is not connected in v0.1.0-alpha.1; no job was leased and no local state was read or changed"
            .into(),
    ))
}

pub fn artifact(command: &ArtifactCommand) -> Result<String, CliError> {
    match command {
        ArtifactCommand::Verify(args) => artifact_verify(args),
    }
}

fn artifact_verify(args: &ArtifactVerifyArgs) -> Result<String, CliError> {
    let (actual, size) = sha256_file(&args.artifact)?;
    let matches = if let Some(expected) = args.sha256.as_deref() {
        if !valid_sha256(expected) {
            return Err(CliError::Validation(
                "--sha256 must contain exactly 64 lowercase hexadecimal characters".into(),
            ));
        }
        if expected != actual {
            return Err(CliError::Integrity(format!(
                "expected {expected}, calculated {actual} for {}",
                args.artifact.display()
            )));
        }
        Some(true)
    } else {
        None
    };
    let result = ArtifactResult {
        artifact: args.artifact.display().to_string(),
        sha256: actual,
        size,
        matches_expected: matches,
    };
    if args.json {
        pretty_json(&result)
    } else {
        Ok(format!(
            "Artifact: {}\nSize: {} bytes\nSHA-256: {}{}",
            result.artifact,
            result.size,
            result.sha256,
            if result.matches_expected == Some(true) {
                "\nIntegrity: verified"
            } else {
                ""
            }
        ))
    }
}

fn probe_tool(name: &'static str, arguments: &[&str], required: bool) -> DoctorCheck {
    let output = ProcessCommand::new(name)
        .args(arguments)
        .stdin(Stdio::null())
        .stderr(Stdio::null())
        .output();
    match output {
        Ok(output) if output.status.success() => {
            let detail = String::from_utf8_lossy(&output.stdout)
                .lines()
                .next()
                .unwrap_or("available")
                .trim()
                .chars()
                .take(200)
                .collect();
            DoctorCheck {
                name,
                status: CheckStatus::Ok,
                detail,
                required,
            }
        }
        Ok(output) => DoctorCheck {
            name,
            status: if required {
                CheckStatus::Error
            } else {
                CheckStatus::Warning
            },
            detail: format!("exited with {}", output.status),
            required,
        },
        Err(error) => DoctorCheck {
            name,
            status: if required {
                CheckStatus::Error
            } else {
                CheckStatus::Warning
            },
            detail: format!("not available: {error}"),
            required,
        },
    }
}

fn pretty_json<T: Serialize>(value: &T) -> Result<String, CliError> {
    serde_json::to_string_pretty(value)
        .map_err(|error| CliError::InvalidSpec(format!("cannot serialize command output: {error}")))
}

fn shell_neutral_path(path: &Path) -> String {
    path.display().to_string()
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ValidationResult {
    valid: bool,
    schema_version: String,
    sha256: String,
    targets: Vec<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
enum AnalysisStatus {
    Ready,
    ChangesRequired,
}

impl AnalysisStatus {
    const fn as_str(self) -> &'static str {
        match self {
            Self::Ready => "ready",
            Self::ChangesRequired => "changes_required",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
enum FindingSeverity {
    Info,
    ChangesRequired,
}

impl FindingSeverity {
    const fn as_str(self) -> &'static str {
        match self {
            Self::Info => "info",
            Self::ChangesRequired => "changes_required",
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Finding {
    code: &'static str,
    severity: FindingSeverity,
    message: &'static str,
    remediation: &'static str,
}

impl Finding {
    const fn required(
        code: &'static str,
        message: &'static str,
        remediation: &'static str,
    ) -> Self {
        Self {
            code,
            severity: FindingSeverity::ChangesRequired,
            message,
            remediation,
        }
    }

    const fn info(code: &'static str, message: &'static str, remediation: &'static str) -> Self {
        Self {
            code,
            severity: FindingSeverity::Info,
            message,
            remediation,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AnalysisReport<'a> {
    report_version: &'static str,
    app_spec_sha256: &'a str,
    status: AnalysisStatus,
    findings: Vec<Finding>,
    limitations: Vec<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
enum CheckStatus {
    Ok,
    Warning,
    Error,
}

impl CheckStatus {
    const fn as_str(self) -> &'static str {
        match self {
            Self::Ok => "ok",
            Self::Warning => "warning",
            Self::Error => "error",
        }
    }
}

#[derive(Debug, Serialize)]
struct DoctorCheck {
    name: &'static str,
    status: CheckStatus,
    detail: String,
    required: bool,
}

impl DoctorCheck {
    fn ok(name: &'static str, detail: String) -> Self {
        Self {
            name,
            status: CheckStatus::Ok,
            detail,
            required: true,
        }
    }

    fn warning(name: &'static str, detail: String) -> Self {
        Self {
            name,
            status: CheckStatus::Warning,
            detail,
            required: false,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct DoctorReport {
    ready: bool,
    checks: Vec<DoctorCheck>,
    runner_connected: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ManifestSpecReference<'a> {
    schema_version: &'a str,
    sha256: &'a str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ManifestApplication<'a> {
    display_name: &'a str,
    slug: &'a str,
    version: &'a str,
    build_number: u64,
    platform_identifier: String,
}

#[derive(Debug, Serialize)]
struct DeveloperSource {
    kind: &'static str,
    location: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ManifestSecurity {
    allowed_origins: Vec<String>,
    oauth_origins: Vec<String>,
    external_links: &'static str,
    native_capabilities: BTreeMap<String, bool>,
    remote_tauri_api_enabled: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ManifestRuntime {
    framework: &'static str,
    major_version: u8,
    webview: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ManifestTarget {
    operating_system: &'static str,
    architecture: &'static str,
    format: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ManifestSigning {
    status: &'static str,
    required_for_distribution: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct WindowsDeveloperManifest<'a> {
    artifact_type: &'static str,
    artifact_version: &'static str,
    app_spec: ManifestSpecReference<'a>,
    application: ManifestApplication<'a>,
    source: DeveloperSource,
    security: ManifestSecurity,
    runtime: ManifestRuntime,
    target: ManifestTarget,
    signing: ManifestSigning,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct BuildResult {
    target: &'static str,
    artifact: String,
    artifact_sha256: String,
    size: u64,
    signed: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ArtifactResult {
    artifact: String,
    sha256: String,
    size: u64,
    matches_expected: Option<bool>,
}
