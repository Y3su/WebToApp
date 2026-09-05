mod cli;
mod commands;
mod digest;
mod error;
mod safe_io;
mod spec;

use std::ffi::OsString;

use clap::Parser;

pub use error::CliError;

use cli::{Cli, Command};

/// Parse command-line arguments and execute one `wta` command.
///
/// # Errors
///
/// Returns [`CliError`] when argument parsing, validation, safe I/O, integrity checks,
/// or an intentionally unavailable operation fails.
pub fn execute<I, T>(arguments: I) -> Result<String, CliError>
where
    I: IntoIterator<Item = T>,
    T: Into<OsString> + Clone,
{
    let cli = Cli::try_parse_from(arguments)?;
    match &cli.command {
        Command::Init(args) => commands::init(args),
        Command::Validate(args) => commands::validate_spec(args),
        Command::Analyze(args) => commands::analyze(args),
        Command::Doctor(args) => commands::doctor(args),
        Command::Build(args) => commands::build(args),
        Command::Runner(args) => commands::runner(&args.command),
        Command::Artifact(args) => commands::artifact(&args.command),
    }
}
