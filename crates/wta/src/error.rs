use std::path::PathBuf;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum CliError {
    #[error("{0}")]
    Arguments(#[from] clap::Error),

    #[error("cannot read {path}: {source}")]
    Read {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },

    #[error("cannot write {path}: {source}")]
    Write {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },

    #[error("unsafe path {path}: {reason}")]
    UnsafePath { path: PathBuf, reason: String },

    #[error("invalid AppSpec: {0}")]
    InvalidSpec(String),

    #[error("validation failed:\n{0}")]
    Validation(String),

    #[error("artifact integrity check failed: {0}")]
    Integrity(String),

    #[error("unsupported operation: {0}")]
    Unsupported(String),
}

impl CliError {
    #[must_use]
    pub const fn exit_code(&self) -> u8 {
        match self {
            Self::Arguments(_) => 2,
            Self::InvalidSpec(_) | Self::Validation(_) => 3,
            Self::Read { .. } | Self::Write { .. } => 4,
            Self::Integrity(_) => 5,
            Self::Unsupported(_) => 6,
            Self::UnsafePath { .. } => 7,
        }
    }
}
