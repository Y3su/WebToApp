use std::path::PathBuf;

use clap::{Args, Parser, Subcommand, ValueEnum};

#[derive(Debug, Parser)]
#[command(
    name = "wta",
    version,
    about = "Build secure native shells for customer-owned web applications",
    long_about = None
)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Debug, Subcommand)]
pub enum Command {
    /// Create a conservative `AppSpec` starter file.
    Init(InitArgs),
    /// Validate an `AppSpec` and its security invariants.
    Validate(SpecArgs),
    /// Produce an offline compatibility and store-readiness report.
    Analyze(AnalyzeArgs),
    /// Inspect the local host and required developer tools.
    Doctor(DoctorArgs),
    /// Build an initial deterministic developer artifact.
    Build(BuildArgs),
    /// Manage the customer-controlled runner.
    Runner(RunnerArgs),
    /// Inspect and verify build artifacts.
    Artifact(ArtifactArgs),
}

#[derive(Debug, Args)]
pub struct InitArgs {
    /// Human-readable application name.
    #[arg(long)]
    pub name: String,

    /// HTTPS start URL owned by the customer.
    #[arg(long)]
    pub url: String,

    /// Reverse-DNS prefix used for initial platform identifiers.
    #[arg(long, default_value = "com.example")]
    pub identifier_base: String,

    /// `AppSpec` destination.
    #[arg(short, long, default_value = "webtoapp.json")]
    pub output: PathBuf,

    /// Replace an existing regular file. Symlinks are never followed.
    #[arg(long)]
    pub force: bool,
}

#[derive(Debug, Args)]
pub struct SpecArgs {
    /// `AppSpec` file to validate.
    #[arg(default_value = "webtoapp.json")]
    pub spec: PathBuf,

    /// Emit machine-readable JSON.
    #[arg(long)]
    pub json: bool,
}

#[derive(Debug, Args)]
pub struct AnalyzeArgs {
    /// `AppSpec` file to analyze.
    #[arg(default_value = "webtoapp.json")]
    pub spec: PathBuf,

    /// Emit machine-readable JSON.
    #[arg(long)]
    pub json: bool,
}

#[derive(Debug, Args)]
pub struct DoctorArgs {
    /// Emit machine-readable JSON.
    #[arg(long)]
    pub json: bool,
}

#[derive(Clone, Copy, Debug, ValueEnum)]
pub enum BuildTarget {
    /// Deterministic, unsigned Windows developer manifest (no executable yet).
    WindowsDev,
}

#[derive(Debug, Args)]
pub struct BuildArgs {
    /// `AppSpec` file to compile.
    #[arg(default_value = "webtoapp.json")]
    pub spec: PathBuf,

    /// Initial build target.
    #[arg(long, value_enum, default_value_t = BuildTarget::WindowsDev)]
    pub target: BuildTarget,

    /// Artifact output directory.
    #[arg(short, long, default_value = "dist")]
    pub output_dir: PathBuf,

    /// Replace an existing regular artifact. Symlinks are never followed.
    #[arg(long)]
    pub force: bool,

    /// Emit machine-readable JSON.
    #[arg(long)]
    pub json: bool,
}

#[derive(Debug, Args)]
pub struct RunnerArgs {
    #[command(subcommand)]
    pub command: RunnerCommand,
}

#[derive(Debug, Subcommand)]
pub enum RunnerCommand {
    /// Validate enrollment input; secure enrollment is intentionally unavailable.
    Enroll(RunnerEnrollArgs),
    /// Start an enrolled runner; runner transport is intentionally unavailable.
    Start(RunnerStartArgs),
}

#[derive(Debug, Args)]
pub struct RunnerEnrollArgs {
    /// HTTPS URL of the `WebToApp` control plane.
    #[arg(long)]
    pub control_plane: String,

    /// Organization identifier supplied by the control plane.
    #[arg(long)]
    pub organization: String,

    /// Future runner state location. No state is written by this release.
    #[arg(long, default_value = ".wta")]
    pub state_dir: PathBuf,
}

#[derive(Debug, Args)]
pub struct RunnerStartArgs {
    /// Future runner state location. No state is read by this release.
    #[arg(long, default_value = ".wta")]
    pub state_dir: PathBuf,
}

#[derive(Debug, Args)]
pub struct ArtifactArgs {
    #[command(subcommand)]
    pub command: ArtifactCommand,
}

#[derive(Debug, Subcommand)]
pub enum ArtifactCommand {
    /// Calculate an artifact digest and optionally compare it to an expected value.
    Verify(ArtifactVerifyArgs),
}

#[derive(Debug, Args)]
pub struct ArtifactVerifyArgs {
    /// Regular artifact file to verify.
    pub artifact: PathBuf,

    /// Expected lowercase SHA-256 digest.
    #[arg(long)]
    pub sha256: Option<String>,

    /// Emit machine-readable JSON.
    #[arg(long)]
    pub json: bool,
}
