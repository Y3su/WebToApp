use std::{
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Component, Path, PathBuf},
};

use crate::error::CliError;

pub const MAX_SPEC_BYTES: u64 = 1024 * 1024;

pub fn validate_path_syntax(path: &Path) -> Result<(), CliError> {
    reject_ambiguous_path(path)
}

pub fn read_regular_file_limited(path: &Path, maximum: u64) -> Result<Vec<u8>, CliError> {
    validate_input_path(path)?;
    let file = File::open(path).map_err(|source| CliError::Read {
        path: path.to_path_buf(),
        source,
    })?;
    let metadata = file.metadata().map_err(|source| CliError::Read {
        path: path.to_path_buf(),
        source,
    })?;
    if metadata.len() > maximum {
        return Err(CliError::UnsafePath {
            path: path.to_path_buf(),
            reason: format!("file is larger than the {maximum}-byte safety limit"),
        });
    }

    let capacity = usize::try_from(metadata.len()).unwrap_or(0);
    let mut bytes = Vec::with_capacity(capacity);
    file.take(maximum.saturating_add(1))
        .read_to_end(&mut bytes)
        .map_err(|source| CliError::Read {
            path: path.to_path_buf(),
            source,
        })?;
    if u64::try_from(bytes.len()).unwrap_or(u64::MAX) > maximum {
        return Err(CliError::UnsafePath {
            path: path.to_path_buf(),
            reason: format!(
                "file changed while reading and exceeded the {maximum}-byte safety limit"
            ),
        });
    }
    Ok(bytes)
}

pub fn ensure_output_directory(path: &Path) -> Result<PathBuf, CliError> {
    reject_ambiguous_path(path)?;
    if path.exists() {
        let metadata = fs::symlink_metadata(path).map_err(|source| CliError::Read {
            path: path.to_path_buf(),
            source,
        })?;
        if metadata.file_type().is_symlink() || !metadata.is_dir() {
            return Err(CliError::UnsafePath {
                path: path.to_path_buf(),
                reason: "output directory must be a real directory, not a file or symlink".into(),
            });
        }
    } else {
        fs::create_dir_all(path).map_err(|source| CliError::Write {
            path: path.to_path_buf(),
            source,
        })?;
    }
    fs::canonicalize(path).map_err(|source| CliError::Read {
        path: path.to_path_buf(),
        source,
    })
}

pub fn write_regular_file(path: &Path, contents: &[u8], force: bool) -> Result<(), CliError> {
    reject_ambiguous_path(path)?;
    let parent = path
        .parent()
        .filter(|value| !value.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));
    if !parent.exists() {
        fs::create_dir_all(parent).map_err(|source| CliError::Write {
            path: parent.to_path_buf(),
            source,
        })?;
    }
    let parent_metadata = fs::symlink_metadata(parent).map_err(|source| CliError::Read {
        path: parent.to_path_buf(),
        source,
    })?;
    if parent_metadata.file_type().is_symlink() || !parent_metadata.is_dir() {
        return Err(CliError::UnsafePath {
            path: parent.to_path_buf(),
            reason: "parent must be a real directory, not a file or symlink".into(),
        });
    }

    if path.exists() {
        let metadata = fs::symlink_metadata(path).map_err(|source| CliError::Read {
            path: path.to_path_buf(),
            source,
        })?;
        if metadata.file_type().is_symlink() || !metadata.is_file() {
            return Err(CliError::UnsafePath {
                path: path.to_path_buf(),
                reason: "destination must be a regular file, never a symlink".into(),
            });
        }
        if !force {
            return Err(CliError::Write {
                path: path.to_path_buf(),
                source: std::io::Error::new(
                    std::io::ErrorKind::AlreadyExists,
                    "destination exists; pass --force to replace it",
                ),
            });
        }
    }

    let mut options = OpenOptions::new();
    options.write(true);
    if force {
        options.create(true).truncate(true);
    } else {
        options.create_new(true);
    }
    let mut file = options.open(path).map_err(|source| CliError::Write {
        path: path.to_path_buf(),
        source,
    })?;
    file.write_all(contents).map_err(|source| CliError::Write {
        path: path.to_path_buf(),
        source,
    })?;
    file.sync_all().map_err(|source| CliError::Write {
        path: path.to_path_buf(),
        source,
    })
}

fn validate_input_path(path: &Path) -> Result<(), CliError> {
    reject_ambiguous_path(path)?;
    let metadata = fs::symlink_metadata(path).map_err(|source| CliError::Read {
        path: path.to_path_buf(),
        source,
    })?;
    if metadata.file_type().is_symlink() {
        return Err(CliError::UnsafePath {
            path: path.to_path_buf(),
            reason: "symbolic links are not accepted for security-sensitive input".into(),
        });
    }
    if !metadata.is_file() {
        return Err(CliError::UnsafePath {
            path: path.to_path_buf(),
            reason: "input must be a regular file".into(),
        });
    }
    Ok(())
}

fn reject_ambiguous_path(path: &Path) -> Result<(), CliError> {
    if path.as_os_str().is_empty() {
        return Err(CliError::UnsafePath {
            path: path.to_path_buf(),
            reason: "empty paths are not accepted".into(),
        });
    }
    if path
        .components()
        .any(|component| matches!(component, Component::ParentDir))
    {
        return Err(CliError::UnsafePath {
            path: path.to_path_buf(),
            reason: "parent-directory traversal (`..`) is not accepted".into(),
        });
    }
    // Check every existing ancestor, including dangling links. Checking only the
    // final component permits a parent symlink/junction to redirect reads/writes.
    let absolute = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir()
            .map_err(|source| CliError::Read {
                path: path.to_path_buf(),
                source,
            })?
            .join(path)
    };
    for ancestor in absolute.ancestors() {
        match fs::symlink_metadata(ancestor) {
            Ok(metadata) if is_link_or_reparse_point(&metadata) => {
                return Err(CliError::UnsafePath {
                    path: ancestor.to_path_buf(),
                    reason: "symlink or reparse-point ancestors are not accepted".into(),
                });
            }
            Ok(_) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(source) => {
                return Err(CliError::Read {
                    path: ancestor.to_path_buf(),
                    source,
                })
            }
        }
    }
    Ok(())
}

fn is_link_or_reparse_point(metadata: &fs::Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        metadata.file_attributes() & 0x400 != 0 // FILE_ATTRIBUTE_REPARSE_POINT
    }
    #[cfg(not(windows))]
    {
        metadata.file_type().is_symlink()
    }
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    fn tempdir() -> std::io::Result<tempfile::TempDir> {
        tempfile::tempdir_in(std::fs::canonicalize(std::env::temp_dir())?)
    }

    use super::{read_regular_file_limited, write_regular_file};

    #[test]
    fn refuses_parent_traversal() {
        let result = write_regular_file(Path::new("safe/../unsafe.json"), b"{}", false);
        assert!(result.is_err());
    }

    #[test]
    fn refuses_to_overwrite_without_force() {
        let directory = tempdir().unwrap();
        let path = directory.path().join("spec.json");
        write_regular_file(&path, b"first", false).unwrap();
        assert!(write_regular_file(&path, b"second", false).is_err());
        assert_eq!(read_regular_file_limited(&path, 32).unwrap(), b"first");
    }

    #[cfg(unix)]
    #[test]
    fn rejects_symlink_ancestors_and_dangling_links() {
        use std::{fs, os::unix::fs::symlink};
        let directory = tempdir().unwrap();
        let target = directory.path().join("target");
        fs::create_dir(&target).unwrap();
        fs::write(target.join("input.json"), b"{}").unwrap();
        let link = directory.path().join("link");
        symlink(&target, &link).unwrap();
        assert!(read_regular_file_limited(&link.join("input.json"), 32).is_err());
        assert!(write_regular_file(&link.join("output.json"), b"{}", false).is_err());
        assert!(super::ensure_output_directory(&link.join("nested")).is_err());
        assert!(!target.join("output.json").exists());
        assert!(!target.join("nested").exists());
        let dangling = directory.path().join("dangling");
        symlink(directory.path().join("missing"), &dangling).unwrap();
        assert!(write_regular_file(&dangling, b"{}", true).is_err());
    }
}
